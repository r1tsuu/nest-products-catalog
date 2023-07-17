import { UsersService } from '../users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../users/enums/roles.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn().mockResolvedValue(null),
            findOneByUsername: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((userData) =>
              Promise.resolve({
                id: 'test-uuid',
                roles: [Role.User],
                ...userData,
              }),
            ),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((data) =>
              Object.values(data)
                .map((each) => (Array.isArray(each) ? each.join(',') : each))
                .join(','),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);

    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation((string) => Promise.resolve(string + '_hashed'));

    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((value, hashed) =>
        Promise.resolve(hashed === value + '_hashed'),
      );
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('Should hash a password', async () => {
      const hashedPassword1 = await service.hashPassword('some-password');
      expect(hashedPassword1).toEqual('some-password_hashed');

      const hashedPassword2 = await service.hashPassword(
        'some-password-second',
      );
      expect(hashedPassword2).toEqual('some-password-second_hashed');
    });
  });

  describe('register', () => {
    it('Should register a user', async () => {
      const user = await service.register({
        username: 'John',
        email: 'john@gmail.com',
        password: 'some-password',
      });
      expect(user).toEqual({
        id: expect.any(String),
        username: 'John',
        email: 'john@gmail.com',
        password: 'some-password_hashed',
        roles: [Role.User],
      });
    });

    it('Should fail because username already exists', async () => {
      jest.spyOn(usersService, 'findOneByUsername').mockResolvedValueOnce({
        id: 'uuid-test',
        username: 'John',
        email: 'john@gmail.com',
        password: 'some-password_hashed',
        roles: [Role.User],
      });

      await expect(
        service.register({
          username: 'John',
          email: 'john@gmail.com',
          password: 'some-password',
        }),
      ).rejects.toThrow('User with that username already exists');
    });

    it('Should fail because email already exists', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValueOnce({
        id: 'uuid-test',
        username: 'John',
        email: 'john@gmail.com',
        password: 'some-password_hashed',
        roles: [Role.User, Role.Admin],
      });

      await expect(
        service.register({
          username: 'John',
          email: 'john@gmail.com',
          password: 'some-password',
        }),
      ).rejects.toThrow('User with that email already exists');
    });
  });

  describe('verifyPassword', () => {
    it('Should matches', async () => {
      const matches = await service.verifyPassword(
        'test-pass',
        'test-pass_hashed',
      );
      expect(matches).toEqual(true);
    });
    it('Should not match', async () => {
      const matches = await service.verifyPassword(
        'test-pass',
        'test-pass_hashed_wrong',
      );
      expect(matches).toEqual(false);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('Should find authenticated user', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValueOnce({
        id: 'uuid-test',
        username: 'William',
        email: 'william@gmail.com',
        password: 'strong-password_hashed',
        roles: [Role.User],
      });

      const user = await service.getAuthenticatedUser(
        'william@gmail.com',
        'strong-password',
      );

      expect(user).toEqual({
        id: 'uuid-test',
        username: 'William',
        email: 'william@gmail.com',
        password: 'strong-password_hashed',
        roles: [Role.User],
      });
    });
  });

  describe('signToken', () => {
    it('Should sign a token', async () => {
      const token = await service.signToken({
        id: 'uuid-user-test',
        username: 'William',
        email: 'william@gmail.com',
        password: 'strong-password_hashed',
        roles: [Role.User],
      });
      expect(token).toEqual('uuid-user-test,user');
    });
    it('Should sign a different token', async () => {
      const token = await service.signToken({
        id: 'uuid-user-2-test',
        username: 'William',
        email: 'william@gmail.com',
        password: 'strong-password_hashed',
        roles: [Role.User, Role.Admin],
      });
      expect(token).toEqual('uuid-user-2-test,user,admin');
    });
  });

  describe('login', () => {
    it('Should return an access token', async () => {
      const getAuthenticatedUserSpy = jest
        .spyOn(service, 'getAuthenticatedUser')
        .mockResolvedValue({
          id: 'uuid-user-test',
          username: 'William',
          email: 'william@gmail.com',
          password: 'strong-password_hashed',
          roles: [Role.User],
        });
      const token = await service.login({
        email: 'william@gmail.com',
        password: 'strong-password',
      });

      expect(getAuthenticatedUserSpy).toBeCalledTimes(1);
      expect(getAuthenticatedUserSpy).toBeCalledWith(
        'william@gmail.com',
        'strong-password',
      );
      expect(token).toEqual('uuid-user-test,user');
    });
  });
});
