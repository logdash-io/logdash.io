ALTER TABLE web_events
ADD COLUMN IF NOT EXISTS utm_content LowCardinality(String) DEFAULT '';
