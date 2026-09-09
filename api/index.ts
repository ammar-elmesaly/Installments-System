import 'pg';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import serverlessHttp from 'serverless-http';
import { AppModule } from '../src/app.module';

const server = express();
let cachedHandler: ReturnType<typeof serverlessHttp>;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  await app.init();
  return serverlessHttp(server);
}

export default async (req: any, res: any) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrapServer();
  }
  return cachedHandler(req, res);
};