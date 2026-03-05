import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips properties that are not in the DTO
    forbidNonWhitelisted: true, // Throws an error if extra properties are sent
    transform: true, // Automatically transforms payloads to DTO instances
  }));

  // Enable CORS (Essential for your React Frontend)
  app.enableCors();

  await app.listen(3000);
}
bootstrap();