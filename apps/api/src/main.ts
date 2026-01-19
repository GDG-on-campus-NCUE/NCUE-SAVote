import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust Proxy (Required for secure cookies behind Nginx/Load Balancer)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security Headers
  app.use(helmet());

  // Global Prefix
  app.setGlobalPrefix('api');

  // Serve Static Assets (Uploads)
  // Maps /uploads to the actual uploads folder
  // Replaced useStaticAssets with standard express.static to avoid path-to-regexp issues in Express 5
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const isProduction = process.env.NODE_ENV === 'production';
  console.log(
    `Starting API in ${process.env.NODE_ENV} mode. Secure cookies: ${isProduction}`,
  );

  // Session Configuration (Required for Passport-SAML)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret-session-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000,
        secure: isProduction, // Only true in production
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site redirects in some browsers
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN,
      'http://localhost:5173',
      'https://election.ncuesa.org.tw',
    ].filter((origin): origin is string => !!origin),
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('SAVote API')
    .setDescription('The SAVote API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API server running on http://0.0.0.0:${port}`);
  console.log(
    `📚 Swagger documentation available at http://0.0.0.0:${port}/api`,
  );
}
bootstrap();
