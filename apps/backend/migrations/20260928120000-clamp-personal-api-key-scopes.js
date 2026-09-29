const MAX_GRANT = {
  logs: 'read',
  metrics: 'read',
  monitors: 'delete',
  projects: 'read',
  clusters: 'read',
  account: 'read',
};

const ACTION_RANK = { none: 0, read: 1, write: 2, delete: 3 };

function clamp(scopes) {
  return scopes
    .filter((scope) => Object.hasOwn(MAX_GRANT, scope.resource))
    .map((scope) =>
      ACTION_RANK[scope.action] > ACTION_RANK[MAX_GRANT[scope.resource]]
        ? { resource: scope.resource, action: MAX_GRANT[scope.resource] }
        : scope,
    );
}

async function up(db) {
  const personalApiKeys = db.collection('personalApiKeys');
  const cursor = personalApiKeys.find({}, { projection: { _id: 1, scopes: 1 } });

  let operations = [];

  for await (const key of cursor) {
    const scopes = key.scopes ?? [];
    const clamped = clamp(scopes);

    if (clamped.length === scopes.length && clamped.every((scope, i) => scope === scopes[i])) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: key._id, scopes },
        update: { $set: { scopes: clamped } },
      },
    });

    if (operations.length === 500) {
      await personalApiKeys.bulkWrite(operations);
      operations = [];
    }
  }

  if (operations.length > 0) {
    await personalApiKeys.bulkWrite(operations);
  }
}

async function down() {}

module.exports = { up, down };
