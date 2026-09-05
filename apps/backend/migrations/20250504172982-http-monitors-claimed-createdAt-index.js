async function up(db) {
  await db.collection('httpMonitors').createIndex({ claimed: 1, createdAt: -1 });
}

async function down(db) {}

module.exports = { up, down };
