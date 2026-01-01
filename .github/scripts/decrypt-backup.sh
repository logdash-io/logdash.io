#!/bin/bash

set -e

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
trap "rm -rf $TEMP_DIR" EXIT

# Extract salt, IV, and HMAC from the beginning of the file (first 160 bytes are text header)
SALT=$(head -c 64 "$ENCRYPTED_FILE")
IV=$(head -c 96 "$ENCRYPTED_FILE" | tail -c 32)
HMAC=$(head -c 160 "$ENCRYPTED_FILE" | tail -c 64)

# Validate salt, IV, and HMAC format (should be hex)
if ! echo "$SALT" | grep -qE '^[0-9a-fA-F]{64}$'; then
    echo "⚠️  File doesn't appear to be encrypted with our format, copying as-is (backward compatibility)"
    cp "$ENCRYPTED_FILE" "$OUTPUT_FILE"
    echo "✅ File copied successfully (unencrypted)"
    exit 0
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

# Derive encryption key and HMAC key using the same method as encryption
DERIVED_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 64)
HMAC_KEY=$(echo -n "$ENCRYPTION_KEY$SALT$IV" | openssl dgst -sha256 -binary | xxd -p -c 64)

# Extract encrypted data to temp file (skip first 160 bytes which contain salt, IV, and HMAC)
ENCRYPTED_TEMP="$TEMP_DIR/encrypted.bin"
tail -c +161 "$ENCRYPTED_FILE" > "$ENCRYPTED_TEMP"

# Verify HMAC before decrypting (compute from file, not variable)
CALCULATED_HMAC=$(openssl dgst -sha256 -hmac "$HMAC_KEY" -binary "$ENCRYPTED_TEMP" | xxd -p -c 64)

if [ "$HMAC" != "$CALCULATED_HMAC" ]; then
    echo "❌ HMAC verification failed - file may be corrupted or tampered with"
    exit 1
fi

echo "✅ HMAC verification passed"

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
