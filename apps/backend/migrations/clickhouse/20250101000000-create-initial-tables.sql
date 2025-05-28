-- Create httpPings table optimized for ClickHouse performance
CREATE TABLE IF NOT EXISTS httpPings (
    _id String,
    httpMonitorId String,
    statusCode UInt16,
    responseTimeMs UInt32,
    message String,
    createdAt DateTime64 (3),
    updatedAt DateTime64 (3)
) ENGINE = MergeTree ()
ORDER BY (
        httpMonitorId, toStartOfHour (createdAt), _id
    )
PARTITION BY
    toYYYYMM (createdAt) SETTINGS index_granularity = 8192,
    compress_block_size = 65536,
    max_compress_block_size = 1048576;

-- Add secondary indexes for common query patterns
ALTER TABLE httpPings
ADD INDEX idx_created_at createdAt TYPE minmax GRANULARITY 4;

ALTER TABLE httpPings
ADD INDEX idx_status_code statusCode TYPE set(100) GRANULARITY 1;

ALTER TABLE httpPings
ADD INDEX idx_response_time responseTimeMs TYPE minmax GRANULARITY 4;