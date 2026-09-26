async function up(db) {
  const users = db.collection('users');
  const cursor = users.find(
    { accountClaimStatus: 'claimed', termsAcceptedAt: { $exists: false } },
    { projection: { _id: 1, createdAt: 1, onboarding: 1 } },
  );

  let operations = [];

  for await (const user of cursor) {
    const acceptedAt = user.createdAt ?? new Date();
    const set = { termsAcceptedAt: acceptedAt };

    if (!user.onboarding?.completedAt) {
      set['onboarding.completedAt'] = acceptedAt;
    }

    operations.push({
      updateOne: {
        filter: { _id: user._id, termsAcceptedAt: { $exists: false } },
        update: { $set: set },
      },
    });

    if (operations.length === 500) {
      await users.bulkWrite(operations);
      operations = [];
    }
  }

  if (operations.length > 0) {
    await users.bulkWrite(operations);
  }
}

async function down(db) {
  await db
    .collection('users')
    .updateMany({}, { $unset: { termsAcceptedAt: '', 'onboarding.completedAt': '' } });
}

module.exports = { up, down };
