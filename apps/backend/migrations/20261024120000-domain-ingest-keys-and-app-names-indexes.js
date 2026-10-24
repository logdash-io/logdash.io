async function up(db) {
  await db
    .collection('apiKeys')
    .createIndex(
      { clusterId: 1 },
      { unique: true, partialFilterExpression: { clusterId: { $exists: true } } },
    );

  await db
    .collection('projects')
    .createIndex(
      { clusterId: 1, name: 1 },
      { unique: true, partialFilterExpression: { autoCreated: true } },
    );
}

async function down(db) {
  await db.collection('apiKeys').dropIndex({ clusterId: 1 });
  await db.collection('projects').dropIndex({ clusterId: 1, name: 1 });
}

module.exports = { up, down };
