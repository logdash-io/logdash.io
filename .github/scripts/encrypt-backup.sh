#!/bin/bash

set -e

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

echo "🔐 Encrypting backup file..."
echo "📁 Input: $INPUT_FILE"
echo "📁 Output: $OUTPUT_FILE"

# Create temp directory for intermediate files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Generate a random salt and IV
SALT=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)

echo "🔑 Generated salt: ${SALT:0:16}..."
echo "🔑 Generated IV: ${IV:0:8}..."

# Derive encryption key from the provided key using the salt
DERIVED_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 64)

# Encrypt the file using AES-256-CBC - stream directly to temp file (binary, no base64)
ENCRYPTED_TEMP="$TEMP_DIR/encrypted.bin"
if ! openssl enc -aes-256-cbc -e -K "$DERIVED_KEY" -iv "$IV" -in "$INPUT_FILE" -out "$ENCRYPTED_TEMP"; then
    echo "❌ Encryption failed"
    exit 1
fi

echo "🔒 File encrypted, computing HMAC..."

# Derive HMAC key
HMAC_KEY=$(echo -n "$ENCRYPTION_KEY$SALT$IV" | openssl dgst -sha256 -binary | xxd -p -c 64)

# Calculate HMAC of encrypted data for authentication (stream from file)
HMAC=$(openssl dgst -sha256 -hmac "$HMAC_KEY" -binary "$ENCRYPTED_TEMP" | xxd -p -c 64)

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
