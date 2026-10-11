const STALE_INDEX = 'clusterId_1_invitedUserId_1';

async function up(db) {
  const invites = db.collection('clusterInvites');
  if (await invites.indexExists(STALE_INDEX)) {
    await invites.dropIndex(STALE_INDEX);
  }
  await invites.createIndex({ clusterId: 1, invitedUserEmail: 1 });
}

async function down(db) {
  await db.collection('clusterInvites').dropIndex({ clusterId: 1, invitedUserEmail: 1 });
}

module.exports = { up, down };
