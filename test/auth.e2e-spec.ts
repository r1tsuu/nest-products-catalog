import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ClassSerializerInterceptor,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../src/app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { Reflector } from '@nestjs/core';
import { User } from '../src/app/users/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/app/users/enums/roles.enum';
import { dbModule } from './db';

const mockUserSave = {
  username: 'test-username',
  email: 'testemail@asd.com',
  password: 'hash_password',
  roles: [Role.User],
};

const mockUser = {
  username: 'username',
  email: 'test@email.com',
  password: 'Password123',
};

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), dbModule('auth', User), AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    usersRepo = moduleRef.get(getRepositoryToken(User));

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.init();
  });

  beforeEach(async () => {
    await usersRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  const saveUser = async () => {
    const password = await bcrypt.hash(mockUser.password, 10);
    await usersRepo.save({
      ...mockUser,
      password,

      roles: [Role.User],
    });
  };

  describe('POST /auth/register', () => {
    it('Should register a user', async () => {
      const user = await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(201);

      expect(user.body).toEqual({
        id: expect.any(String),
        email: mockUser.email,
        username: mockUser.username,
        roles: ['user'],
      });
    });

    it('Should prevent duplicate emails', async () => {
      await usersRepo.save({ ...mockUserSave, email: 'email@email.com' });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...mockUser,
          email: 'email@email.com',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should prevent duplicate usernames', async () => {
      await usersRepo.save({ ...mockUserSave, username: 'john' });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...mockUser,
          username: 'john',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should validate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...mockUser, email: 'wrongemail' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/sign-in', () => {
    it('Should return object with access token', async () => {
      await saveUser();
      const { username, ...credentials } = mockUser;
      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(credentials)
        .expect(200);

      expect(body).toEqual({
        access_token: expect.any(String),
      });
    });
    it('Should return error with wrong credentials', async () => {
      await saveUser();
      // Password
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: mockUser.email,
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
          password: mockUser.password,
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) =>
          expect((res.body.message = 'Wrong credentials provided')),
        );
    });
  });
});
