import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randEmail, randText } from '@ngneat/falso';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { User } from '@/users/user.entity';
import { Role } from '@/users/interfaces/role.enum';

import { dbModule } from './__utils__/db';
import { randRegisterData } from './__utils__/auth';
import { bootstrap } from './__utils__/bootstrap';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), dbModule('auth'), AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    usersRepo = moduleRef.get(getRepositoryToken(User));

    await bootstrap(app);
  });

  beforeEach(async () => {
    await usersRepo.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  const saveUser = async (userData: any) => {
    const password = await bcrypt.hash(userData.password, 10);
    return usersRepo.save({ roles: [Role.User], ...userData, password });
  };

  describe('POST /auth/register', () => {
    it('Should register a user', async () => {
      const dataToRegister = randRegisterData();

      const user = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dataToRegister)
        .expect(201);

      expect(user.body).toEqual({
        id: expect.any(String),
        email: dataToRegister.email,
        username: dataToRegister.username,
        roles: ['user'],
        orders: [],
      });
    });

    it('Should prevent duplicate emails', async () => {
      const email = randEmail();
      await usersRepo.save({
        ...randRegisterData(),
        roles: [Role.User],
        email,
      });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...randRegisterData(),
          email: email,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should prevent duplicate usernames', async () => {
      const username = randText();
      await usersRepo.save({
        ...randRegisterData(),
        roles: [Role.User],
        username,
      });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...randRegisterData(),
          username,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should validate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...randRegisterData(), email: 'not-email' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/sign-in', () => {
    it('Should return object with access token and user', async () => {
      const userData = randRegisterData();
      const user = await saveUser(userData);
      const credentials = {
        email: userData.email,
        password: userData.password,
      };

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(credentials)
        .expect(200);

      expect(body.accessToken).toBeTruthy();
      expect(body.user.id).toBe(user.id);
    });

    it('Should return errors with wrong credentials', async () => {
      const userData = randRegisterData();
      await saveUser(userData);

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: userData.email,
          password: 'wrong password',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) =>
          expect((res.body.message = 'Wrong credentials provided')),
        );

      // Email
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'wrong@email.com',
          password: userData.password,
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) =>
          expect((res.body.message = 'Wrong credentials provided')),
        );
    });
  });
});
