ALTER TABLE logs 
MODIFY COLUMN id FixedString(24) CODEC(ZSTD),
MODIFY COLUMN project_id FixedString(24) CODEC(ZSTD),
MODIFY COLUMN created_at DateTime64(3) DEFAULT now64(3) CODEC(Delta, ZSTD),
MODIFY COLUMN sequence_number UInt32 DEFAULT 0 CODEC(Delta, ZSTD),
MODIFY COLUMN level Enum8(
    'info' = 1,
    'warning' = 2,
    'error' = 3,
    'silly' = 4,
    'http' = 5,
    'debug' = 6,
    'verbose' = 7,
) CODEC(ZSTD),
MODIFY COLUMN message String CODEC(ZSTD);

OPTIMIZE TABLE logs FORCE; 