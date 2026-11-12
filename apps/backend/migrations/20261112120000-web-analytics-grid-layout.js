async function up(db) {
  const sites = db.collection('webAnalyticsSites');
  await sites.updateMany(
    { $or: [{ 'insights.section': { $exists: true } }, { 'insights.width': { $exists: true } }] },
    { $unset: { 'insights.$[].section': '', 'insights.$[].width': '' } },
  );
  await sites.updateMany(
    { 'views.sections': { $exists: true } },
    { $unset: { 'views.$[].sections': '' } },
  );
}

async function down() {}

module.exports = { up, down };
