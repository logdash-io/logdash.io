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

# Derive key from the provided key using PBKDF2 with the salt
DERIVED_KEY=$(echo -n "$ENCRYPTION_KEY$SALT" | openssl dgst -sha256 -binary | xxd -p -c 256)

# Create encrypted file with salt and IV prepended
{
    echo -n "$SALT"
    echo -n "$IV" 
    openssl enc -aes-256-gcm -e -K "$DERIVED_KEY" -iv "$IV" -in "$INPUT_FILE"
} > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup encrypted successfully"
    echo "📊 Original size: $(stat -c%s "$INPUT_FILE" 2>/dev/null || stat -f%z "$INPUT_FILE") bytes"
    echo "📊 Encrypted size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE") bytes"
else
    echo "❌ Encryption failed"
    exit 1
fi 