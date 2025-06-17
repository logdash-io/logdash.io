#!/bin/bash

set -e

echo "🧪 Testing backup encryption/decryption..."

# Generate a test key
TEST_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Create a test backup file
echo "Creating test backup file..."
mkdir -p test_backup
echo "Test backup data $(date)" > test_backup/test_data.txt
echo "backup_timestamp=$(date +%Y%m%d_%H%M%S)" > test_backup/metadata.txt
tar -czf test_backup.tar.gz test_backup/

echo "Original file size: $(stat -c%s test_backup.tar.gz 2>/dev/null || stat -f%z test_backup.tar.gz) bytes"

# Test encryption
echo "🔐 Testing encryption..."
./encrypt-backup.sh test_backup.tar.gz test_backup.tar.gz.enc "$TEST_KEY"

if [ ! -f "test_backup.tar.gz.enc" ]; then
    echo "❌ Encryption failed - encrypted file not created"
    exit 1
fi

echo "Encrypted file size: $(stat -c%s test_backup.tar.gz.enc 2>/dev/null || stat -f%z test_backup.tar.gz.enc) bytes"

# Test decryption
echo "🔓 Testing decryption..."
./decrypt-backup.sh test_backup.tar.gz.enc test_backup_decrypted.tar.gz "$TEST_KEY"

if [ ! -f "test_backup_decrypted.tar.gz" ]; then
    echo "❌ Decryption failed - decrypted file not created"
    exit 1
fi

echo "Decrypted file size: $(stat -c%s test_backup_decrypted.tar.gz 2>/dev/null || stat -f%z test_backup_decrypted.tar.gz) bytes"

# Verify the decrypted file
echo "🔍 Verifying decrypted content..."
mkdir -p test_verification
cd test_verification
tar -xzf ../test_backup_decrypted.tar.gz

if [ ! -f "test_backup/test_data.txt" ] || [ ! -f "test_backup/metadata.txt" ]; then
    echo "❌ Verification failed - missing files in decrypted backup"
    exit 1
fi

ORIGINAL_CONTENT=$(cat ../test_backup/test_data.txt)
DECRYPTED_CONTENT=$(cat test_backup/test_data.txt)

if [ "$ORIGINAL_CONTENT" != "$DECRYPTED_CONTENT" ]; then
    echo "❌ Verification failed - content mismatch"
    echo "Original: $ORIGINAL_CONTENT"
    echo "Decrypted: $DECRYPTED_CONTENT"
    exit 1
fi

cd ..

# Test backward compatibility (unencrypted file)
echo "🔄 Testing backward compatibility..."
./decrypt-backup.sh test_backup.tar.gz test_backup_compat.tar.gz "$TEST_KEY"

if [ ! -f "test_backup_compat.tar.gz" ]; then
    echo "❌ Backward compatibility test failed"
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up test files..."
rm -rf test_backup test_backup.tar.gz test_backup.tar.gz.enc test_backup_decrypted.tar.gz test_backup_compat.tar.gz test_verification

echo "✅ All encryption tests passed successfully!"
echo ""
echo "🔐 Encryption system is working correctly and ready for production use." 