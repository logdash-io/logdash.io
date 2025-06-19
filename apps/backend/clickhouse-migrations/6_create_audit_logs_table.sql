CREATE TABLE audit_logs (
    id FixedString(24) CODEC(ZSTD),
    
    created_at DateTime64(3) DEFAULT now64(3) CODEC(Delta, ZSTD),
    
    user_id Nullable(FixedString(24)) CODEC(ZSTD),

    actor Nullable(String) CODEC(ZSTD),

    action Nullable(String) CODEC(ZSTD),

    related_domain Nullable(String) CODEC(ZSTD),

    description Nullable(String) CODEC(ZSTD),
    
    related_entity_id Nullable(FixedString(24)) CODEC(ZSTD)
) ENGINE = MergeTree()

PARTITION BY toYYYYMM(created_at)

ORDER BY (created_at, id)

SETTINGS index_granularity = 8192; 