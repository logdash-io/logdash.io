const { randomBytes } = require('crypto');

async function up(db) {
  const httpMonitors = db.collection('httpMonitors');
  const cursor = httpMonitors.find({ badgeKey: { $exists: false } }, { projection: { _id: 1 } });

  let operations = [];

  for await (const httpMonitor of cursor) {
    operations.push({
      updateOne: {
        filter: { _id: httpMonitor._id, badgeKey: { $exists: false } },
        update: { $set: { badgeKey: randomBytes(9).toString('base64url') } },
      },
    });

    if (operations.length === 500) {
      await httpMonitors.bulkWrite(operations);
      operations = [];
    }
  }

  if (operations.length > 0) {
    await httpMonitors.bulkWrite(operations);
  }
}

async function down(db) {
  await db.collection('httpMonitors').updateMany({}, { $unset: { badgeKey: '' } });
}

module.exports = { up, down };
