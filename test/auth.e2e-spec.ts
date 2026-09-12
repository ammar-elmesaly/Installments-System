import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { Role } from '../src/accounts/enums/role';

process.env.NODE_ENV = 'development';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const { AppModule } = require('./../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('signs up a client and logs in with the new account', async () => {
    const uniqueId = Date.now().toString();
    const email = `auth-e2e-${uniqueId}@example.com`;
    const password = 'TestPassword123';
    const account = {
      email,
      password,
      first_name: 'Auth',
      second_name: 'E2E',
      third_name: 'Test',
      last_name: uniqueId,
      phone_number: uniqueId.slice(-11),
    };

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(account)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            email,
            role: Role.Client,
          }),
        );
        expect(body.password_hash).toBeUndefined();
      });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201)
      .expect(({ body }) => {
        expect(body.access_token).toEqual(expect.any(String));
        expect(body.access_token).not.toHaveLength(0);
      });
  });

  it('fails to sign up admin if the current session is not a SuperAdmin account', async () => {
    const uniqueId = Date.now().toString();
    const email = `auth-e2e-${uniqueId}@example.com`;
    const password = 'TestPassword123';
    const account = {
      email,
      password,
      first_name: 'Auth',
      second_name: 'E2E',
      third_name: 'Test',
      last_name: uniqueId,
      phone_number: uniqueId.slice(-11),
    };

    await request(app.getHttpServer())
      .post('/api/auth/signup/admin')
      .send(account)
      .expect(401)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            message: 'Unauthorized',
            statusCode: 401,
          }),
        );
      });
  });

  it('signs up an admin and logs in with the new admin account', async () => {
    const uniqueId = Date.now().toString();
    const email = `auth-e2e-${uniqueId}@example.com`;
    const password = 'TestPassword123';

    const superAdmin = {
      email: process.env.SEED_SUPER_ADMIN_EMAIL,
      password: process.env.SEED_SUPER_ADMIN_PASSWORD,
    };

    expect(superAdmin.email).toBeDefined();
    expect(superAdmin.password).toBeDefined();

    const account = {
      email,
      password,
      first_name: 'Auth',
      second_name: 'E2E',
      third_name: 'Test',
      last_name: uniqueId,
      phone_number: uniqueId.slice(-11),
    };

    let access_token: string;

    // login with "seed" super admin account
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: superAdmin.email,
        password: superAdmin.password,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.access_token).toEqual(expect.any(String));
        expect(body.access_token).not.toHaveLength(0);

        // save access_token
        access_token = body.access_token;
      });

    // create new admin account
    await request(app.getHttpServer())
      .post('/api/auth/signup/admin')
      .send(account)
      .auth(access_token, { type: 'bearer' })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            email,
            role: Role.Admin,
          }),
        );
        expect(body.password_hash).toBeUndefined();
      });

    // login with the new admin account
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201)
      .expect(({ body }) => {
        expect(body.access_token).toEqual(expect.any(String));
        expect(body.access_token).not.toHaveLength(0);
      });
  });

  it('rejects login with an incorrect password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'missing-auth-e2e@example.com',
        password: 'WrongPassword123',
      })
      .expect(401)
      .expect({
        message: 'Wrong email or password, please recheck your credentials',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
