ALTER TABLE logs
ADD COLUMN IF NOT EXISTS namespace Nullable (String) CODEC (ZSTD);
