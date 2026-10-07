ALTER TABLE web_events
ADD COLUMN IF NOT EXISTS props Map(LowCardinality(String), String) CODEC (ZSTD);
