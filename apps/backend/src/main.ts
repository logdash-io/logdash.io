import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getEnvConfig } from './shared/configs/env-configs';
import * as basicAuth from 'express-basic-auth';
import { TelegramOptionsValidator } from './notification-channel/core/types/telegram-options.type';
import { WebhookOptionsValidator } from './notification-channel/core/types/webhook-options.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({ origin: '*' });

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
  SwaggerModule.setup('docs', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
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
