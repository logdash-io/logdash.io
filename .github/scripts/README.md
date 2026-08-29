# Backup Encryption Scripts

This directory contains scripts for encrypting and decrypting ClickHouse backup artifacts to secure them in the public repository.

## Overview

The backup system encrypts all database dump artifacts before uploading them as GitHub Actions artifacts. This ensures that sensitive database data is protected even in a public repository.

## Security Features

- **AES-256-CBC encryption** with HMAC-SHA256 authentication for strong security
- **Unique salt and IV** for each backup to prevent rainbow table attacks
- **Key derivation** using PBKDF2-HMAC-SHA256 with 600,000 iterations
- **HMAC verification** to detect tampering or corruption - decryption always fails closed

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

Decrypts an encrypted backup file with HMAC verification. Fails closed: a file without a
valid header, with a bad HMAC, or with the wrong key is rejected and no output is written.

**Usage:**

```bash
./decrypt-backup.sh <encrypted_file> <output_file> <encryption_key>
```

**Example:**

```bash
./decrypt-backup.sh backup.tar.gz.enc backup.tar.gz "$ENCRYPTION_KEY"
```

## GitHub Secrets

The encryption system uses the following GitHub secret:

- `BACKEND_BACKUP_ARTIFACT_KEY`: The encryption key used for all backup encryption/decryption operations

## Workflow Integration

### Backup Workflow

1. Creates ClickHouse backup
2. Compresses backup into tar.gz
3. **Encrypts** the compressed backup using AES-256-CBC + HMAC
4. Removes unencrypted backup for security
5. Uploads the encrypted backup as a workflow artifact (14 day retention)

### Restore Workflow

1. Downloads backup artifact
2. **Decrypts** and **verifies HMAC** of the backup
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
[64 ASCII hex chars: salt][32 ASCII hex chars: IV][64 ASCII hex chars: HMAC][raw AES-256-CBC ciphertext]
```

- Salt: 64 hex characters (32 bytes) - PBKDF2 salt
- IV: 32 hex characters (16 bytes) - initialization vector for AES-CBC
- HMAC: 64 hex characters (32 bytes) - HMAC-SHA256 over the IV followed by the ciphertext
- Encrypted data: raw AES-256-CBC ciphertext (not base64 encoded)

## Security Details

- **Encryption**: AES-256-CBC
- **Authentication**: HMAC-SHA256 over `IV || ciphertext` (encrypt-then-MAC), verified before decryption.
  The IV is inside the MAC because it is carried in the plaintext header; leaving it out would let anyone
  who can rewrite the artifact alter the first plaintext block without failing verification
- **Key Derivation**: PBKDF2-HMAC-SHA256, 600,000 iterations, 64 bytes of output split into
  a 32-byte AES key and a 32-byte HMAC key
- **IV Generation**: Cryptographically secure random bytes

`openssl kdf` (OpenSSL 3.0+) is required. Both scripts fail loudly if it is unavailable.

## Legacy Backups

Backups produced before the PBKDF2 migration used a single unsalted SHA-256 pass as the
"KDF", which is not a KDF at all and is brute-forceable offline at GPU speed.
`decrypt-backup.sh` still accepts those files so that artifacts already in retention can be
restored, but **only after their HMAC verifies** - it never skips authentication and it
never passes an unauthenticated file through. Remove that branch once all pre-migration
backups have aged out.
