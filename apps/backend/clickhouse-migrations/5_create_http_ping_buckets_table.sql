CREATE TABLE http_ping_buckets (
    id FixedString (24),
    http_monitor_id FixedString (24),
    hour_timestamp DateTime64 (3),
    success_count UInt32,
    failure_count UInt32,
    average_latency_ms Float64
) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMMDD (hour_timestamp)
ORDER BY (
        http_monitor_id, hour_timestamp
    ) SETTINGS index_granularity = 8192;