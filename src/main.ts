import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Automatically strip non-whitelisted properties
    transform: true, // Automatically transform payloads to match DTO types
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
