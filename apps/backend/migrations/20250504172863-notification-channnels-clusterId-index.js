async function up(db) {
  await db.collection('notificationChannels').createIndex({ clusterId: 1 });
}

async function down(db) {}

module.exports = { up, down };
