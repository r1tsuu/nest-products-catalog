import { Test, TestingModule } from '@nestjs/testing';
import { randEmail, randPassword, randText } from '@ngneat/falso';

import { randUser } from '@/__test_utils__/user';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  describe('POST /register', () => {
    it('Should register an user', async () => {
      const passwordNotHashed = randText();
      const userData = randUser();
      const registerSpy = jest
        .spyOn(service, 'register')
        .mockResolvedValue(userData);
      const dataToRegister = {
        email: userData.email,
        username: userData.username,
        password: passwordNotHashed,
      };

      const user = await controller.register(dataToRegister);

      expect(user).toEqual(userData);
      expect(registerSpy).toBeCalledWith(dataToRegister);
    });
  });

  describe('sign-in', () => {
    it('Should login an user ', async () => {
      const tokenData = randText({ charCount: 100 });
      const loginSpy = jest
        .spyOn(service, 'login')
        .mockResolvedValue(tokenData);
      const dataToLogin = {
        email: randEmail(),
        password: randPassword(),
      };

      const token = await controller.login(dataToLogin);

      expect(token).toEqual(tokenData);
      expect(loginSpy).toBeCalledWith(dataToLogin);
    });
  });
});
