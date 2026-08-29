#!/bin/bash

set -euo pipefail

# Number of PBKDF2 iterations used to derive the encryption/HMAC keys.
# Keep this in sync with encrypt-backup.sh (PBKDF2_ITERATIONS).
PBKDF2_ITERATIONS=600000

if [ $# -ne 3 ]; then
    echo "Usage: $0 <encrypted_file> <output_file> <encryption_key>"
    echo "Example: $0 backup.tar.gz.enc backup.tar.gz \$ENCRYPTION_KEY"
    exit 1
fi

ENCRYPTED_FILE="$1"
OUTPUT_FILE="$2"
ENCRYPTION_KEY="$3"

if [ ! -f "$ENCRYPTED_FILE" ]; then
    echo "❌ Encrypted file '$ENCRYPTED_FILE' not found"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Encryption key is empty"
    exit 1
fi

echo "🔓 Decrypting backup file..."
echo "📁 Input: $ENCRYPTED_FILE"
echo "📁 Output: $OUTPUT_FILE"

# Check if file is encrypted (has our format)
FILE_SIZE=$(stat -c%s "$ENCRYPTED_FILE" 2>/dev/null || stat -f%z "$ENCRYPTED_FILE")
if [ "$FILE_SIZE" -lt 160 ]; then
    echo "❌ File too small to be encrypted with our format"
    exit 1
fi

# Create temp directory for intermediate files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Extract salt, IV, and HMAC from the beginning of the file (first 160 bytes are text header)
SALT=$(head -c 64 "$ENCRYPTED_FILE")
IV=$(head -c 96 "$ENCRYPTED_FILE" | tail -c 32)
HMAC=$(head -c 160 "$ENCRYPTED_FILE" | tail -c 64)

# Validate salt, IV, and HMAC format (should be hex).
# There is deliberately NO plaintext passthrough here: a file that does not carry a
# valid header is rejected rather than copied through unauthenticated.
if ! echo "$SALT" | grep -qE '^[0-9a-fA-F]{64}$'; then
    echo "❌ Invalid salt format - file is not a valid encrypted backup"
    exit 1
fi

if ! echo "$IV" | grep -qE '^[0-9a-fA-F]{32}$'; then
    echo "❌ Invalid IV format in encrypted file"
    exit 1
fi

if ! echo "$HMAC" | grep -qE '^[0-9a-fA-F]{64}$'; then
    echo "❌ Invalid HMAC format in encrypted file"
    exit 1
fi

echo "🔍 Extracted salt: ${SALT:0:16}..."
echo "🔍 Extracted IV: ${IV:0:16}..."
echo "🔍 Extracted HMAC: ${HMAC:0:16}..."

# Extract encrypted data to temp file (skip first 160 bytes which contain salt, IV, and HMAC)
ENCRYPTED_TEMP="$TEMP_DIR/encrypted.bin"
tail -c +161 "$ENCRYPTED_FILE" > "$ENCRYPTED_TEMP"

DERIVED_KEY=""

# The current format MACs IV || ciphertext so that the IV in the plaintext header
# is authenticated too. Keep this in sync with encrypt-backup.sh.
IV_TEMP="$TEMP_DIR/iv.bin"
printf '%s' "$IV" | xxd -r -p > "$IV_TEMP"

# Preferred derivation: PBKDF2-HMAC-SHA256, 64 bytes split into AES key + HMAC key.
if openssl kdf -help >/dev/null 2>&1; then
    KEY_MATERIAL=$(openssl kdf \
        -keylen 64 \
        -kdfopt "digest:SHA256" \
        -kdfopt "pass:$ENCRYPTION_KEY" \
        -kdfopt "hexsalt:$SALT" \
        -kdfopt "iter:$PBKDF2_ITERATIONS" \
        -binary PBKDF2 | xxd -p -c 128)

    if [ "${#KEY_MATERIAL}" -eq 128 ]; then
        CANDIDATE_KEY="${KEY_MATERIAL:0:64}"
        CANDIDATE_HMAC_KEY="${KEY_MATERIAL:64:64}"
        CALCULATED_HMAC=$(cat "$IV_TEMP" "$ENCRYPTED_TEMP" |
            openssl dgst -sha256 -mac HMAC -macopt "hexkey:$CANDIDATE_HMAC_KEY" -binary | xxd -p -c 64)

        if [ "$HMAC" = "$CALCULATED_HMAC" ]; then
            DERIVED_KEY="$CANDIDATE_KEY"
            echo "✅ HMAC verification passed (PBKDF2, $PBKDF2_ITERATIONS iterations)"
        fi
    fi
fi

# Legacy derivation: single-pass SHA-256 (weak KDF), kept only so that backups
# produced before the PBKDF2 migration can still be restored. The HMAC is still
# verified - this path never skips authentication.
# TODO: remove once all pre-PBKDF2 backups have aged out of retention.
if [ -z "$DERIVED_KEY" ]; then
    LEGACY_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 64)
    LEGACY_HMAC_KEY=$(echo -n "$ENCRYPTION_KEY$SALT$IV" | openssl dgst -sha256 -binary | xxd -p -c 64)
    LEGACY_CALCULATED_HMAC=$(openssl dgst -sha256 -hmac "$LEGACY_HMAC_KEY" -binary "$ENCRYPTED_TEMP" | xxd -p -c 64)

    if [ "$HMAC" = "$LEGACY_CALCULATED_HMAC" ]; then
        DERIVED_KEY="$LEGACY_KEY"
        echo "⚠️  HMAC verification passed using the LEGACY single-pass SHA-256 derivation"
        echo "⚠️  This backup predates the PBKDF2 migration and its passphrase is brute-forceable offline"
    fi
fi

if [ -z "$DERIVED_KEY" ]; then
    echo "❌ HMAC verification failed - wrong key, or file is corrupted or tampered with"
    exit 1
fi

# Decrypt the data (stream from file to file)
if ! openssl enc -aes-256-cbc -d -K "$DERIVED_KEY" -iv "$IV" -in "$ENCRYPTED_TEMP" -out "$OUTPUT_FILE"; then
    echo "❌ Decryption failed"
    exit 1
fi

if [ -f "$OUTPUT_FILE" ]; then
    echo "✅ Backup decrypted successfully"
    echo "📊 Encrypted size: $(stat -c%s "$ENCRYPTED_FILE" 2>/dev/null || stat -f%z "$ENCRYPTED_FILE") bytes"
    echo "📊 Decrypted size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE") bytes"
else
    echo "❌ Decryption failed - output file not created"
    exit 1
fi
