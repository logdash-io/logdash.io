CREATE TABLE http_pings (
    id FixedString(24),
    
    http_monitor_id FixedString(24),
    
    created_at DateTime64(3) DEFAULT now64(3),

    status_code UInt16,
    response_time_ms UInt32,
    
    message Nullable(String),
) ENGINE = MergeTree()

PARTITION BY toYYYYMMDD(created_at)

ORDER BY (http_monitor_id, created_at)

SETTINGS index_granularity = 8192; 