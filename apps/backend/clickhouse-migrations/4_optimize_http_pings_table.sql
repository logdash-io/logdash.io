ALTER TABLE http_pings
MODIFY COLUMN id FixedString (24) CODEC (ZSTD),
MODIFY COLUMN http_monitor_id FixedString (24) CODEC (ZSTD),
MODIFY COLUMN created_at DateTime64 (3) DEFAULT now64 (3) CODEC (Delta, ZSTD),
MODIFY COLUMN status_code UInt16 CODEC (ZSTD),
MODIFY COLUMN response_time_ms UInt32 CODEC (Delta, ZSTD),
MODIFY COLUMN message Nullable (String) CODEC (ZSTD);

OPTIMIZE TABLE http_pings FORCE;