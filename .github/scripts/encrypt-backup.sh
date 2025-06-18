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

# Generate a random salt and IV
SALT=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)

# Derive encryption key and HMAC key from the provided key using the salt
DERIVED_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 64)
HMAC_KEY=$(echo -n "$ENCRYPTION_KEY$SALT$IV" | openssl dgst -sha256 -binary | xxd -p -c 64)

# Encrypt the file using AES-256-CBC
ENCRYPTED_DATA=$(openssl enc -aes-256-cbc -e -K "$DERIVED_KEY" -iv "$IV" -in "$INPUT_FILE" | base64 -w 0)

# Calculate HMAC of encrypted data for authentication
HMAC=$(echo -n "$ENCRYPTED_DATA" | openssl dgst -sha256 -hmac "$HMAC_KEY" -binary | xxd -p -c 64)

# Create encrypted file with salt, IV, HMAC, and encrypted data
{
    echo -n "$SALT"
    echo -n "$IV"
    echo -n "$HMAC"
    echo -n "$ENCRYPTED_DATA"
} > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup encrypted successfully"
    echo "📊 Original size: $(stat -c%s "$INPUT_FILE" 2>/dev/null || stat -f%z "$INPUT_FILE") bytes"
    echo "📊 Encrypted size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE") bytes"
else
    echo "❌ Encryption failed"
    exit 1
fi 