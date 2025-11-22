import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  // src/main.ts
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('ShopyVerse API Core')
    .setDescription('API de gestion catalogue et back-office')
    .setVersion('1.0')
    .addBearerAuth() // Pour le token JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Retire les champs non déclarés dans le DTO (Sécurité)
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
