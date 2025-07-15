CREATE TABLE metrics (
    id FixedString(24) CODEC(ZSTD),
    
    metric_register_entry_id FixedString(24) CODEC(ZSTD),
    
    recorded_at DateTime64(3) DEFAULT now64(3) CODEC(Delta, ZSTD),
    
    value Float64 CODEC(Delta, ZSTD)
) ENGINE = MergeTree()

PARTITION BY toYYYYMMDD(recorded_at)

ORDER BY (metric_register_entry_id, recorded_at)

SETTINGS index_granularity = 8192; 