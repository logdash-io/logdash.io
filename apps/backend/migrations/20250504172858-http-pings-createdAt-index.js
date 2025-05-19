async function up(db) {
  await db.collection('httpPings').createIndex({ createdAt: 1 });
}

async function down(db) {}

module.exports = { up, down }; 