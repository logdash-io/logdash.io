async function up(db) {
  await db.collection('metrics').createIndex({ metricRegisterEntryId: 1, granularity: 1 });
}

async function down(db) {}

module.exports = { up, down };
