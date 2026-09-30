import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { StatusPageCoreModule } from '../status-page/core/status-page-core.module';

async function exportStatusPageOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Logdash status page API')
    .setVersion('1')
    .addServer('https://api.logdash.io')
    .build();

  const document = SwaggerModule.createDocument(app, config, { include: [StatusPageCoreModule] });

  writeFileSync(
    join(__dirname, '../../openapi/status-page-v1.json'),
    `${JSON.stringify(document, null, 2)}\n`,
  );

  process.exit(0);
}

exportStatusPageOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
