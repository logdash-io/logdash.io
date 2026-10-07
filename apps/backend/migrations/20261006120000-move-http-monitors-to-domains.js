const { ObjectId } = require('mongodb');

const PROJECT_MONITORS_SINCE = new Date('2025-06-09T00:00:00Z');

async function backfillBatch(db, monitors) {
  const projectIds = [...new Set(monitors.map((monitor) => monitor.projectId))].filter((id) =>
    ObjectId.isValid(id),
  );

  const projects = await db
    .collection('projects')
    .find(
      { _id: { $in: projectIds.map((id) => new ObjectId(id)) } },
      { projection: { clusterId: 1 } },
    )
    .toArray();

  const clusterIdByProjectId = new Map(
    projects.map((project) => [project._id.toString(), project.clusterId]),
  );

  const operations = monitors
    .filter((monitor) => clusterIdByProjectId.get(monitor.projectId))
    .map((monitor) => ({
      updateOne: {
        filter: { _id: monitor._id, clusterId: { $exists: false } },
        update: { $set: { clusterId: clusterIdByProjectId.get(monitor.projectId) } },
      },
    }));

  if (operations.length > 0) {
    await db.collection('httpMonitors').bulkWrite(operations);
  }
}

async function up(db) {
  await db.collection('httpMonitors').updateMany(
    {
      projectId: { $exists: false },
      clusterId: { $exists: true },
      $or: [{ createdAt: { $lt: PROJECT_MONITORS_SINCE } }, { createdAt: { $exists: false } }],
    },
    { $rename: { clusterId: 'legacyClusterId' } },
  );

  const cursor = db
    .collection('httpMonitors')
    .find({ clusterId: { $exists: false } }, { projection: { _id: 1, projectId: 1 } });

  let batch = [];

  for await (const monitor of cursor) {
    batch.push(monitor);

    if (batch.length === 500) {
      await backfillBatch(db, batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await backfillBatch(db, batch);
  }

  await db.collection('httpMonitors').createIndex({ clusterId: 1 });
}

async function down(db) {
  await db
    .collection('httpMonitors')
    .updateMany({ projectId: { $exists: true } }, { $unset: { clusterId: '' } });
  await db
    .collection('httpMonitors')
    .updateMany(
      { legacyClusterId: { $exists: true } },
      { $rename: { legacyClusterId: 'clusterId' } },
    );
}

module.exports = { up, down };
