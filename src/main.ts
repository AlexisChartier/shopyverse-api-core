import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import {
  metricsHandler,
  metricsMiddleware,
  requestIdMiddleware,
} from './observability/metrics';
import { loggingMiddleware } from './observability/logging';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Sécurité HTTP de base (CSP/HSTS)
  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: http:;",
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Request ID correlation
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  instance.use(requestIdMiddleware);
  instance.use(metricsMiddleware);
  instance.use(loggingMiddleware);

  const allowedOrigins = (
    process.env.FRONTEND_URLS ??
    'http://localhost:5173,http://localhost:4173,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ShopyVerse API Core')
    .setDescription('API de gestion catalogue et back-office')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Expose Prometheus metrics
  instance.get('/metrics', metricsHandler);

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
