import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting application initialization...');

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cookie parser for refresh tokens
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
    ].filter(Boolean),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // API versioning
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.PORT);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📚 Swagger docs available at /api/docs`);
}

bootstrap();