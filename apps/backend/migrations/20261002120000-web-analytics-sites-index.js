async function up(db) {
  await db.collection('webAnalyticsSites').createIndex({ clusterId: 1 }, { unique: true });
}

async function down(db) {
  await db.collection('webAnalyticsSites').dropIndex({ clusterId: 1 });
}

module.exports = { up, down };
