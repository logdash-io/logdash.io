CREATE TABLE logs (
    id FixedString(24),
    
    project_id FixedString(24),
    
    created_at DateTime64(3) DEFAULT now64(3),
    sequence_number UInt32 DEFAULT 0,

    level Enum8(
        'info' = 1,
        'warning' = 2,
        'error' = 3,
        'silly' = 4,
        'http' = 5,
        'debug' = 6,
        'verbose' = 7,
    ),
    
    message String,
) ENGINE = MergeTree()

PARTITION BY toYYYYMMDD(created_at)

ORDER BY (project_id, created_at, sequence_number)

SETTINGS index_granularity = 8192; 