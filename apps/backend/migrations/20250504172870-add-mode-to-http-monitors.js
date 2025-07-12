async function up(db) {
  await db.collection('httpMonitors').updateMany({}, { $set: { mode: 'pull' } });
}

async function down(db) {}

module.exports = { up, down };
