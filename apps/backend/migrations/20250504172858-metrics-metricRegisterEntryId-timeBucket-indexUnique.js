async function up(db) {
  await db
    .collection('metrics')
    .createIndex({ metricRegisterEntryId: 1, timeBucket: 1 }, { unique: true });
}

async function down(db) {}

module.exports = { up, down };
