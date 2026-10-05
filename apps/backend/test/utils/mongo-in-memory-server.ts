import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer } from 'node:net';

const MAX_START_ATTEMPTS = 3;

let mongod: MongoMemoryServer;

// the library's own port probe binds the wildcard address, which succeeds even when 127.0.0.1 is taken,
// and the free port can still be taken by another process before mongod binds it
const findFreeLoopbackPort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address
          ? resolve(address.port)
          : reject(new Error('No free port')),
      );
    });
  });

const createMongoMemoryServer = async (attempt = 1): Promise<MongoMemoryServer> => {
  try {
    return await MongoMemoryServer.create({
      instance: { ip: '127.0.0.1', port: await findFreeLoopbackPort() },
    });
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
