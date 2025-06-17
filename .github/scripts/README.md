# Backup Encryption Scripts

This directory contains scripts for encrypting and decrypting ClickHouse backup artifacts to secure them in the public repository.

## Overview

The backup system encrypts all database dump artifacts before uploading them as GitHub Actions artifacts. This ensures that sensitive database data is protected even in a public repository.

## Security Features

- **AES-256-CBC encryption** with HMAC-SHA256 authentication for strong security
- **Unique salt and IV** for each backup to prevent rainbow table attacks
- **Key derivation** using SHA-256 to strengthen the encryption key
- **HMAC verification** to detect tampering or corruption
- **Backward compatibility** with existing unencrypted backups

## Scripts

### `encrypt-backup.sh`

Encrypts a backup file using AES-256-CBC encryption with HMAC authentication.

**Usage:**

```bash
./encrypt-backup.sh <input_file> <output_file> <encryption_key>
```

**Example:**

```bash
./encrypt-backup.sh backup.tar.gz backup.tar.gz.enc "$ENCRYPTION_KEY"
```

### `decrypt-backup.sh`

Decrypts an encrypted backup file with HMAC verification. Includes backward compatibility for unencrypted files.

**Usage:**

```bash
./decrypt-backup.sh <encrypted_file> <output_file> <encryption_key>
```

**Example:**

```bash
./decrypt-backup.sh backup.tar.gz.enc backup.tar.gz "$ENCRYPTION_KEY"
```

### `test-encryption.sh`

Tests the encryption and decryption process to ensure everything works correctly.

**Usage:**

```bash
./test-encryption.sh
```

## GitHub Secrets

The encryption system uses the following GitHub secret:

- `BACKEND_BACKUP_ARTIFACT_KEY`: The encryption key used for all backup encryption/decryption operations

## Workflow Integration

### Backup Workflow

1. Creates ClickHouse backup
2. Compresses backup into tar.gz
3. **Encrypts** the compressed backup using AES-256-CBC + HMAC
4. Uploads encrypted backup as artifact
5. Removes unencrypted backup for security

### Restore Workflow

1. Downloads backup artifact
2. **Decrypts** and **verifies HMAC** of the backup (with backward compatibility)
3. Extracts and validates backup
4. Restores database tables

## Key Management

**Important:** The encryption key should be:

- A 64-character hexadecimal string (256-bit key)
- Generated using a cryptographically secure random number generator
- Stored only in GitHub Secrets, never in code or logs
- Rotated periodically for security best practices

**Key Generation Example:**

```bash
openssl rand -hex 32
```

## File Format

Encrypted files use a custom format:

```
[64-byte salt][32-byte IV][64-byte HMAC][base64-encoded encrypted data]
```

- Salt: 64 hex characters (32 bytes) - used for key derivation
- IV: 32 hex characters (16 bytes) - initialization vector for AES-CBC
- HMAC: 64 hex characters (32 bytes) - HMAC-SHA256 for authentication
- Encrypted data: AES-256-CBC encrypted backup, base64 encoded

## Security Details

- **Encryption**: AES-256-CBC mode (compatible with older OpenSSL versions)
- **Authentication**: HMAC-SHA256 to prevent tampering
- **Key Derivation**: SHA-256 hash of (master_key + salt)
- **HMAC Key**: SHA-256 hash of (master_key + salt + IV)
- **IV Generation**: Cryptographically secure random bytes

## Backward Compatibility

The decryption script automatically detects whether a file is encrypted or not:

- If encrypted (has valid salt/IV/HMAC header): decrypts and verifies the file
- If unencrypted: copies the file as-is for compatibility

This ensures existing unencrypted backups continue to work during the transition period.
