const { createClient } = require('@clickhouse/client');

module.exports = {
  /**
   * @param config {object} ClickHouse configuration
   * @returns {Promise<void>}
   */
  async up(config) {
    const client = createClient(config);

    // Create httpPings table optimized for ClickHouse performance
    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS httpPings (
            _id String,
            httpMonitorId String,
            statusCode UInt16,
            responseTimeMs UInt32,
            message String,
            createdAt DateTime64(3),
            updatedAt DateTime64(3)
        ) ENGINE = MergeTree()
        ORDER BY (httpMonitorId, toStartOfHour(createdAt), _id)
        PARTITION BY toYYYYMM(createdAt)
        SETTINGS 
            index_granularity = 8192,
            compress_block_size = 65536,
            max_compress_block_size = 1048576
      `,
    });

    // Add secondary indexes for common query patterns
    await client.command({
      query: 'ALTER TABLE httpPings ADD INDEX idx_created_at createdAt TYPE minmax GRANULARITY 4',
    });

    await client.command({
      query: 'ALTER TABLE httpPings ADD INDEX idx_status_code statusCode TYPE set(100) GRANULARITY 1',
    });

    await client.command({
      query: 'ALTER TABLE httpPings ADD INDEX idx_response_time responseTimeMs TYPE minmax GRANULARITY 4',
    });

    await client.close();
  },

  /**
   * @param config {object} ClickHouse configuration
   * @returns {Promise<void>}
   */
  async down(config) {
    const client = createClient(config);

    await client.command({
      query: 'DROP TABLE IF EXISTS httpPings',
    });

    await client.close();
  },
}; 