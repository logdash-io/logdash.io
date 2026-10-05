CREATE TABLE IF NOT EXISTS web_events (
    id UUID,
    cluster_id FixedString(24) CODEC(ZSTD),
    site_id FixedString(24) CODEC(ZSTD),
    visitor_id FixedString(64) CODEC(ZSTD),
    session_id FixedString(64) CODEC(ZSTD),
    visitor_started_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD),
    created_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD),
    received_at DateTime64(3, 'UTC') DEFAULT now64(3) CODEC(Delta, ZSTD),
    expires_at DateTime('UTC'),
    name LowCardinality(String),
    hostname LowCardinality(String),
    path String CODEC(ZSTD),
    referrer LowCardinality(String),
    utm_source LowCardinality(String),
    utm_medium LowCardinality(String),
    utm_campaign LowCardinality(String),
    utm_term LowCardinality(String),
    click_id LowCardinality(String),
    device LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country LowCardinality(String)
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (cluster_id, toDate(created_at), site_id, id)
TTL expires_at DELETE
SETTINGS index_granularity = 8192;
