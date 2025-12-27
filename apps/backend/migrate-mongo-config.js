require('dotenv').config();

const config = {
  mongodb: {
    url: process.env.MIGRATIONS_MONGO_URL,
    databaseName: 'test',
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'migrations',
  lockCollectionName: 'migrations_lock',
  lockTtl: 0,
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
