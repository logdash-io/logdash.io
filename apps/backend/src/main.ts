import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getEnvConfig } from './shared/configs/env-configs';
import * as basicAuth from 'express-basic-auth';

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
  SwaggerModule.setup('docs', app, documentFactory, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      
      /* Dark mode styles */
      .swagger-ui {
        background: #1a1a1a;
        color: #e5e5e5;
      }
      
      .swagger-ui .info .title {
        color: #3b82f6;
      }
      
      .swagger-ui .info .description,
      .swagger-ui .info .description p {
        color: #d1d5db;
      }
      
      .swagger-ui .scheme-container {
        background: #374151;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #4b5563;
      }
      
      .swagger-ui .opblock {
        background: #374151;
        border: 1px solid #4b5563;
        border-radius: 6px;
        margin-bottom: 10px;
      }
      
      .swagger-ui .opblock .opblock-summary {
        border-bottom: 1px solid #4b5563;
      }
      
      .swagger-ui .opblock.opblock-get {
        background: #065f46;
        border-color: #059669;
      }
      
      .swagger-ui .opblock.opblock-post {
        background: #1e3a8a;
        border-color: #3b82f6;
      }
      
      .swagger-ui .opblock.opblock-put {
        background: #92400e;
        border-color: #f59e0b;
      }
      
      .swagger-ui .opblock.opblock-delete {
        background: #991b1b;
        border-color: #ef4444;
      }
      
      .swagger-ui .parameters-container,
      .swagger-ui .responses-wrapper {
        background: #1f2937;
        border: 1px solid #4b5563;
        border-radius: 4px;
      }
      
      .swagger-ui .parameter__name,
      .swagger-ui .parameter__type {
        color: #d1d5db;
      }
      
      .swagger-ui .btn {
        background: #3b82f6;
        color: white;
        border: 1px solid #2563eb;
        border-radius: 4px;
      }
      
      .swagger-ui .btn:hover {
        background: #2563eb;
      }
      
      .swagger-ui .btn.authorize {
        background: #059669;
        border-color: #047857;
      }
      
      .swagger-ui .btn.authorize:hover {
        background: #047857;
      }
      
      .swagger-ui input[type="text"],
      .swagger-ui input[type="password"],
      .swagger-ui textarea,
      .swagger-ui select {
        background: #374151;
        color: #e5e5e5;
        border: 1px solid #6b7280;
        border-radius: 4px;
      }
      
      .swagger-ui .highlight-code {
        background: #1f2937;
        color: #e5e5e5;
      }
      
      .swagger-ui .model-box {
        background: #1f2937;
        border: 1px solid #4b5563;
        border-radius: 4px;
      }
      
      .swagger-ui .model .property {
        color: #d1d5db;
      }
      
      .swagger-ui .model .property.primitive {
        color: #60a5fa;
      }
      
      .swagger-ui .response-col_status {
        color: #d1d5db;
      }
      
      .swagger-ui .response-col_links {
        color: #60a5fa;
      }
      
      /* Custom scrollbar for dark mode */
      .swagger-ui ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .swagger-ui ::-webkit-scrollbar-track {
        background: #1f2937;
      }
      
      .swagger-ui ::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 4px;
      }
      
      .swagger-ui ::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
    `,
    customfavIcon: '/favicon.ico',
    customSiteTitle: 'LogDash API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      tryItOutEnabled: true,
    },
  });

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
