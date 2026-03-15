import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — rejects unknown properties and validates all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend (strict origin + explicit methods/headers)
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3002',
      'http://ti-maikonr.posthaus.com.br:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Project Dashboard API')
    .setDescription('API documentation for the Project Dashboard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
