ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS personal_api_key_id Nullable (FixedString (24)) CODEC (ZSTD);
