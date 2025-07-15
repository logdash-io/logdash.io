async function up(db) {
  await db.collection('customDomains').createIndex({ domain: 1 });
}

async function down(db) {}

module.exports = { up, down };
