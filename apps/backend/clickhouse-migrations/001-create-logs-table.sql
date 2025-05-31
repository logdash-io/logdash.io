-- Active: 1748686884240@@clickhouse.bieda.it@443@my_database
-- Migration: Create logs table
-- Date: 2024-01-01
-- Description: Creates the logs table in ClickHouse with the same structure as MongoDB LogEntity

CREATE TABLE IF NOT EXISTS logs (
    id String,
    createdAt DateTime64 (3),
    message String,
    level LowCardinality (String),
    projectId String,
    `index` UInt32
) ENGINE = MergeTree
PARTITION BY
    toYYYYMM (createdAt)
ORDER BY (projectId, createdAt, id) SETTINGS index_granularity = 8192;

-- Create indexes for better query performance
-- Primary key already includes (projectId, createdAt, id)

-- Add TTL for automatic data cleanup (optional - adjust retention period as needed)
-- ALTER TABLE logs MODIFY TTL createdAt + INTERVAL 90 DAY;