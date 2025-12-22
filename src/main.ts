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

  // CORS - Allow specific origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'x-org-id'],
  });

  // API versioning
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  
  console.log(`🔌 Attempting to listen on port ${port}...`);
  
  await app.listen(port, '0.0.0.0');

  console.log(`📚 Swagger docs available at: http://0.0.0.0:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});