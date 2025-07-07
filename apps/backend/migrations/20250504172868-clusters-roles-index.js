async function up(db) {
  await db.collection('clusters').createIndex({ roles: 1 });
}

async function down(db) {}

module.exports = { up, down };
