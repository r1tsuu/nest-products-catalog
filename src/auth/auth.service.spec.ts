import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { randEmail, randText } from '@ngneat/falso';
import * as bcrypt from 'bcrypt';

import { UsersService } from '@/users/users.service';
import { randUser } from '@/__test_utils__/user';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            findOneByUsername: jest.fn(),
            create: jest.fn().mockImplementation((value: any) => value),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('Should hash a password', async () => {
      const password = randText();
      const hashed = randText();
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashed));

      const hashedPassword1 = await service.hashPassword(password);

      expect(hashedPassword1).toEqual(hashed);
    });
  });

  describe('register', () => {
    it('Should register a user', async () => {
      const password = randText();
      const hashedPassword = randText();
      const userData = { ...randUser(), password: hashedPassword };
      const dataToRegister = {
        email: userData.email,
        username: userData.username,
        password,
      };
      const createSpy = jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(userData);
      const hashPasswordSpy = jest
        .spyOn(service, 'hashPassword')
        .mockResolvedValue(hashedPassword);
      const findOneByEmailSpy = jest.spyOn(usersService, 'findOneByEmail');
      const findOneByUsernameSpy = jest.spyOn(
        usersService,
        'findOneByUsername',
      );

      const user = await service.register(dataToRegister);

      expect(user).toEqual(userData);
      expect(findOneByUsernameSpy).toBeCalledWith(userData.username);
      expect(findOneByEmailSpy).toBeCalledWith(userData.email);
      expect(hashPasswordSpy).toBeCalledWith(password);
      expect(createSpy).toBeCalledWith({
        ...dataToRegister,
        password: hashedPassword,
      });
    });

    it('Should fail because username already exists', async () => {
      const userDataExists = randUser();
      const findOneByUsernameSpy = jest
        .spyOn(usersService, 'findOneByUsername')
        .mockResolvedValue(userDataExists);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dataToRegister = {
        username: userDataExists.username,
        email: randEmail(),
        password: randText(),
      };

      await expect(service.register(dataToRegister)).rejects.toThrow(
        'User with that username already exists',
      );

      expect(findOneByUsernameSpy).toBeCalledWith(dataToRegister.username);
    });

    it('Should fail because email already exists', async () => {
      const userDataExists = randUser();
      const findOneByEmailSpy = jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValueOnce(userDataExists);
      const dataToRegister = {
        email: userDataExists.email,
        username: randText(),
        password: randText(),
      };

      await expect(service.register(dataToRegister)).rejects.toThrow(
        'User with that email already exists',
      );

      expect(findOneByEmailSpy).toBeCalledWith(dataToRegister.email);
    });
  });

  describe('verifyPassword', () => {
    it('Should matches', async () => {
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      const values: [string, string] = [randText(), randText()];

      const matches = await service.verifyPassword(...values);

      expect(matches).toEqual(true);
      expect(compareSpy).toBeCalledWith(...values);
    });

    it('Should not match', async () => {
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      const values: [string, string] = [randText(), randText()];

      const matches = await service.verifyPassword(...values);

      expect(matches).toEqual(true);
      expect(compareSpy).toBeCalledWith(...values);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('Should find authenticated user', async () => {
      const passwordNotHashed = randText();
      const userData = randUser();
      const findOneByEmailSpy = jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValue(userData);
      const verifyPasswordSpy = jest
        .spyOn(service, 'verifyPassword')
        .mockResolvedValue(true);

      const user = await service.getAuthenticatedUser(
        userData.email,
        passwordNotHashed,
      );

      expect(user).toEqual(userData);
      expect(findOneByEmailSpy).toBeCalledWith(userData.email);
      expect(verifyPasswordSpy).toBeCalledWith(
        passwordNotHashed,
        userData.password,
      );
    });

    it('Should fail due to wrong email provided ', async () => {
      const findOneByEmailSpy = jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValue(null);
      const email = randEmail();

      await expect(() =>
        service.getAuthenticatedUser(email, randText()),
      ).rejects.toThrow('Wrong credentials provided');

      expect(findOneByEmailSpy).toBeCalledWith(email);
    });

    it('Should fail due to wrong password provided', async () => {
      const passwordProvided = randText();
      const userData = randUser();
      const findOneByEmailSpy = jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValue(userData);
      const verifyPasswordSpy = jest
        .spyOn(service, 'verifyPassword')
        .mockResolvedValue(false);

      await expect(() =>
        service.getAuthenticatedUser(userData.email, passwordProvided),
      ).rejects.toThrow('Wrong credentials provided');

      expect(findOneByEmailSpy).toBeCalledWith(userData.email);
      expect(verifyPasswordSpy).toBeCalledWith(
        passwordProvided,
        userData.password,
      );
    });
  });

  describe('signToken', () => {
    it('Should sign a token', async () => {
      const userData = randUser();
      const tokenData = randText({ charCount: 1000 });
      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue(tokenData);

      const token = await service.signToken(userData);

      expect(token).toEqual(tokenData);
      expect(signSpy).toBeCalledWith({
        userId: userData.id,
        roles: userData.roles,
      });
    });
  });

  describe('login', () => {
    it('Should return an access token', async () => {
      const passwordNotHashed = randText();
      const userData = randUser();
      const getAuthenticatedUserSpy = jest
        .spyOn(service, 'getAuthenticatedUser')
        .mockResolvedValue(userData);
      const tokenData = randText({ charCount: 100 });
      const signTokenSpy = jest
        .spyOn(service, 'signToken')
        .mockResolvedValue(tokenData);

      const token = await service.login({
        email: userData.email,
        password: passwordNotHashed,
      });

      expect(token).toEqual(tokenData);
      expect(getAuthenticatedUserSpy).toBeCalledWith(
        userData.email,
        passwordNotHashed,
      );
      expect(signTokenSpy).toBeCalledWith(userData);
    });
  });
});
