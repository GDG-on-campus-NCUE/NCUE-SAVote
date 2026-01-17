import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust Proxy (Required for secure cookies behind Nginx/Load Balancer)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security Headers
  app.use(helmet());

  // Session Configuration (Required for Passport-SAML)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret-session-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000,
        secure: process.env.NODE_ENV === 'production', // Requires https
        httpOnly: true,
        sameSite: 'lax', // Allow basic redirection flows
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API server running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger documentation available at http://0.0.0.0:${port}/api`);
}
bootstrap();
