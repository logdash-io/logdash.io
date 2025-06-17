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
if [ "$FILE_SIZE" -lt 96 ]; then
    echo "❌ File too small to be encrypted with our format"
    exit 1
fi

# Extract salt and IV from the beginning of the file
SALT=$(head -c 64 "$ENCRYPTED_FILE")
IV=$(head -c 96 "$ENCRYPTED_FILE" | tail -c 32)

# Validate salt and IV format (should be hex)
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

echo "🔍 Extracted salt: ${SALT:0:16}..."
echo "🔍 Extracted IV: ${IV:0:16}..."

# Derive key from the provided key using the same method as encryption
DERIVED_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 256)

# Extract encrypted data (skip first 96 bytes which contain salt and IV)
tail -c +97 "$ENCRYPTED_FILE" | openssl enc -aes-256-gcm -d -K "$DERIVED_KEY" -iv "$IV" -out "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup decrypted successfully"
    echo "📊 Encrypted size: $(stat -c%s "$ENCRYPTED_FILE" 2>/dev/null || stat -f%z "$ENCRYPTED_FILE") bytes"
    echo "📊 Decrypted size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE") bytes"
else
    echo "❌ Decryption failed"
    exit 1
fi 