import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting application initialization...');
  
  // Run database migrations before starting the app
  await runMigrations();

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

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📚 Swagger docs available at /api/docs`);
}

async function runMigrations() {
  console.log('📊 Checking database migrations...');
  
  try {
    // Use dynamic import to avoid requiring child_process at top level
    const { execSync } = require('child_process');
    
    // Run Prisma migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Database migrations completed successfully');
    
    // Verify the migration was successful by checking the migrations table
    console.log('🔍 Verifying migration status...');
    const output = execSync('npx prisma migrate status', { 
      encoding: 'utf8',
      env: { ...process.env }
    });
    console.log('📋 Migration status:', output);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('⚠️  Continuing without migrations...');
    // Don't exit - let the app start anyway for debugging
  }
}

bootstrap();