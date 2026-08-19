import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getEnvConfig } from './shared/configs/env-configs';
import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { swaggerDarkModeCSS } from './swagger/swagger-dark-mode.js';

// Documented batch maximum is 100 logs x 4096 chars, plus JSON overhead.
const BODY_SIZE_LIMIT = '2mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.enableShutdownHooks();
  app.enableCors({ origin: '*' });

  // Deployed behind a single reverse proxy, so req.ip has to come from the last
  // X-Forwarded-For hop for per-client rate limiting to work.
  app.set('trust proxy', 1);

  app.useBodyParser('json', { limit: BODY_SIZE_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: BODY_SIZE_LIMIT });

  app.use(
    helmet({
      // Applied separately below so it can be skipped for the Swagger UI.
      contentSecurityPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Swagger UI inlines its own scripts and styles, which a strict CSP blocks.
  const contentSecurityPolicy = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`],
      styleSrc: [`'self'`],
      imgSrc: [`'self'`, 'data:'],
      objectSrc: [`'none'`],
      frameAncestors: [`'none'`],
      upgradeInsecureRequests: [],
    },
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/docs')) {
      return next();
    }

    return contentSecurityPolicy(req, res, next);
  });

  const envConfig = getEnvConfig();

  app.use(
    /^\/docs/,
    basicAuth({
      users: { [envConfig.swagger.username]: envConfig.swagger.password },
      challenge: true,
      realm: 'LogDash API Documentation',
    }),
  );

  const config = new DocumentBuilder()
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'project-api-key' }, 'project-api-key')
    .setTitle('LogDash')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    customCss: swaggerDarkModeCSS,
    customSiteTitle: 'LogDash API Documentation',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

process.on('uncaughtException', (error) => {
  console.error(error);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
});

process.on('uncaughtExceptionMonitor', (error) => {
  console.error(error);
});
