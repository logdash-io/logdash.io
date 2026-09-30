import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const MAX_START_ATTEMPTS = 3;

let mongod: MongoMemoryServer;

// the free port it picks can be taken by another process before mongod binds it
const createMongoMemoryServer = async (attempt = 1): Promise<MongoMemoryServer> => {
  try {
    return await MongoMemoryServer.create();
  } catch (error) {
    if (
      attempt < MAX_START_ATTEMPTS &&
      error instanceof Error &&
      error.message.includes('already in use')
    ) {
      return createMongoMemoryServer(attempt + 1);
    }

    throw error;
  }
};

export const rootMongooseTestModule = (options: MongooseModuleOptions = {}) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      mongod = await createMongoMemoryServer();
      const mongoUri = mongod.getUri();

      return {
        uri: mongoUri,
        ...options,
      };
    },
  });

export const closeInMemoryMongoServer = async () => {
  if (mongod) await mongod.stop();
};
