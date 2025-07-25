async function up(db) {
  await db.collection('httpMonitors').updateMany({}, { $set: { claimed: true } });
}

async function down(db) {}

module.exports = { up, down };
