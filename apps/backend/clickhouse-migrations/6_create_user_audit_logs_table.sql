CREATE TABLE user_audit_logs (
    id FixedString(24) CODEC(ZSTD),
    
    user_id FixedString(24) CODEC(ZSTD),
    
    created_at DateTime64(3) DEFAULT now64(3) CODEC(Delta, ZSTD),
    
    actor String CODEC(ZSTD),
    related_domain String CODEC(ZSTD),
    description String CODEC(ZSTD)
) ENGINE = MergeTree()

PARTITION BY toYYYYMMDD(created_at)

ORDER BY (user_id, created_at)

SETTINGS index_granularity = 8192; 