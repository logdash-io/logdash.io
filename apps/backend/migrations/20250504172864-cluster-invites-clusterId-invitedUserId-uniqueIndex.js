async function up(db) {
  await db
    .collection('clusterInvites')
    .createIndex({ clusterId: 1, invitedUserId: 1 }, { unique: true });
}

async function down(db) {}

module.exports = { up, down };
