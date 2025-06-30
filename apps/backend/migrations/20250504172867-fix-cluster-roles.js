async function up(db) {
  const clusters = await db.collection('clusters').find({}).toArray();

  const updates = clusters.map((cluster) => {
    const roles = {};

    roles[cluster.creatorId] = 'creator';

    return {
      updateOne: {
        filter: { _id: cluster._id },
        update: { $set: { roles } },
      },
    };
  });

  if (updates.length > 0) {
    await db.collection('clusters').bulkWrite(updates);
  }
}

async function down(db) {}

module.exports = { up, down };
