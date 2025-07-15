module.exports = {
  async up(db, client) {
    console.log('Starting sync of metric values to metric register counter values...');

    // Find all metrics with all-time granularity
    const allTimeMetrics = await db
      .collection('metrics')
      .find({
        granularity: 'all-time',
      })
      .toArray();

    console.log(`Found ${allTimeMetrics.length} all-time metrics`);

    const bulkOps = [];
    const { ObjectId } = require('mongodb');

    for (const metric of allTimeMetrics) {
      if (typeof metric.value === 'number' && metric.metricRegisterEntryId) {
        let metricRegisterEntryId;

        // Handle both ObjectId and string representations
        try {
          metricRegisterEntryId = ObjectId.isValid(metric.metricRegisterEntryId)
            ? new ObjectId(metric.metricRegisterEntryId)
            : metric.metricRegisterEntryId;
        } catch (e) {
          metricRegisterEntryId = metric.metricRegisterEntryId;
        }

        bulkOps.push({
          updateOne: {
            filter: {
              _id: metricRegisterEntryId,
            },
            update: {
              $set: {
                'values.counter.absoluteValue': metric.value,
              },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      console.log(`Updating ${bulkOps.length} metric register entries...`);
      const result = await db.collection('metricRegisterEntries').bulkWrite(bulkOps);
      console.log(
        `Successfully synced metric values to metric register counter values. Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`,
      );
    } else {
      console.log('No metric register entries to update');
    }
  },

  async down(db, client) {},
};
