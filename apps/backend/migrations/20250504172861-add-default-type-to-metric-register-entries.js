async function up(db) {
  await db.collection('metricRegisterEntries').updateMany({}, { $set: { type: 'counter' } });
}

async function down(db) {}

module.exports = { up, down };
