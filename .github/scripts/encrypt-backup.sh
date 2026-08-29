#!/bin/bash

set -euo pipefail

# Number of PBKDF2 iterations used to derive the encryption/HMAC keys.
# Keep this in sync with decrypt-backup.sh (PBKDF2_ITERATIONS).
PBKDF2_ITERATIONS=600000

if [ $# -ne 3 ]; then
    echo "Usage: $0 <input_file> <output_file> <encryption_key>"
    echo "Example: $0 backup.tar.gz backup.tar.gz.enc \$ENCRYPTION_KEY"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
ENCRYPTION_KEY="$3"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file '$INPUT_FILE' not found"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Encryption key is empty"
    exit 1
fi

if ! openssl kdf -help >/dev/null 2>&1; then
    echo "❌ 'openssl kdf' is not available (OpenSSL 3.0+ required for PBKDF2 key derivation)"
    exit 1
fi

echo "🔐 Encrypting backup file..."
echo "📁 Input: $INPUT_FILE"
echo "📁 Output: $OUTPUT_FILE"

# Create temp directory for intermediate files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Generate a random salt and IV
SALT=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)

echo "🔑 Generated salt: ${SALT:0:16}..."
echo "🔑 Generated IV: ${IV:0:8}..."

# Derive 64 bytes of key material with PBKDF2-HMAC-SHA256 ($PBKDF2_ITERATIONS iterations).
# First 32 bytes -> AES-256 key, last 32 bytes -> HMAC-SHA256 key.
# This replaces the previous single-pass SHA-256 derivation, which was trivially
# brute-forceable offline because it was not a KDF (no work factor).
KEY_MATERIAL=$(openssl kdf \
    -keylen 64 \
    -kdfopt "digest:SHA256" \
    -kdfopt "pass:$ENCRYPTION_KEY" \
    -kdfopt "hexsalt:$SALT" \
    -kdfopt "iter:$PBKDF2_ITERATIONS" \
    -binary PBKDF2 | xxd -p -c 128)

if [ "${#KEY_MATERIAL}" -ne 128 ]; then
    echo "❌ Key derivation failed (expected 64 bytes of key material)"
    exit 1
fi

DERIVED_KEY="${KEY_MATERIAL:0:64}"
HMAC_KEY="${KEY_MATERIAL:64:64}"

# Encrypt the file using AES-256-CBC - stream directly to temp file (binary, no base64)
ENCRYPTED_TEMP="$TEMP_DIR/encrypted.bin"
if ! openssl enc -aes-256-cbc -e -K "$DERIVED_KEY" -iv "$IV" -in "$INPUT_FILE" -out "$ENCRYPTED_TEMP"; then
    echo "❌ Encryption failed"
    exit 1
fi

echo "🔒 File encrypted, computing HMAC..."

# Calculate HMAC over IV || ciphertext (stream from file). The IV has to be
# inside the MAC: it lives in the plaintext header, and an unauthenticated IV
# lets anyone who can rewrite the artifact flip bits in the first plaintext
# block while decrypt-backup.sh still reports a passing HMAC.
# Keep this in sync with decrypt-backup.sh.
IV_TEMP="$TEMP_DIR/iv.bin"
printf '%s' "$IV" | xxd -r -p > "$IV_TEMP"

HMAC=$(cat "$IV_TEMP" "$ENCRYPTED_TEMP" |
    openssl dgst -sha256 -mac HMAC -macopt "hexkey:$HMAC_KEY" -binary | xxd -p -c 64)

echo "🔏 HMAC computed: ${HMAC:0:16}..."

# Create encrypted file with header (salt + IV + HMAC) followed by encrypted binary data
# Header format: 64 bytes salt (hex) + 32 bytes IV (hex) + 64 bytes HMAC (hex) = 160 bytes
{
    echo -n "$SALT"
    echo -n "$IV"
    echo -n "$HMAC"
} > "$OUTPUT_FILE"

# Append encrypted binary data
if ! cat "$ENCRYPTED_TEMP" >> "$OUTPUT_FILE"; then
    echo "❌ Failed to write encrypted data"
    exit 1
fi

if [ -f "$OUTPUT_FILE" ]; then
    echo "✅ Backup encrypted successfully"
    echo "📊 Original size: $(stat -c%s "$INPUT_FILE" 2>/dev/null || stat -f%z "$INPUT_FILE") bytes"
    echo "📊 Encrypted size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE") bytes"
else
    echo "❌ Encryption failed - output file not created"
    exit 1
fi
