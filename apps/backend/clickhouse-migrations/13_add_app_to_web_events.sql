ALTER TABLE web_events
ADD COLUMN IF NOT EXISTS app LowCardinality(String) DEFAULT '';
