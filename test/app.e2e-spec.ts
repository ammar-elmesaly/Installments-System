import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, it } from '@jest/globals';

process.env.NODE_ENV = 'development';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const { AppModule } = require('./../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    await app.init();
  });

  it('rejects cron requests without the security token', () => {
    return request(app.getHttpServer())
      .post('/api/cron-job')
      .expect(401)
      .expect({
        message: 'Access Denied: Invalid Cron Token',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it('accepts cron requests with the security token from the environment', () => {
    const cronSecret = process.env.CRON_SECRET_KEY;

    expect(cronSecret).toBeDefined();

    return request(app.getHttpServer())
      .post('/api/cron-job')
      .set('x-cron-security-token', cronSecret as string)
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
