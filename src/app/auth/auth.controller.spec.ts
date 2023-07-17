import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '../users/enums/roles.enum';

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
            register: jest
              .fn()
              .mockImplementation((registrationData: RegisterDTO) =>
                Promise.resolve({
                  ...registrationData,
                  id: 'uuid-user',
                  roles: [Role.User],
                  password: 'hashed-password',
                }),
              ),
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
      const data = {
        username: 'John',
        email: 'john@gmail.com',
        password: 'some-password',
      };
      const registerSpy = jest.spyOn(service, 'register');
      const userData = await controller.register(data);
      expect(userData).toEqual({
        id: 'uuid-user',
        ...data,
        password: 'hashed-password',
        roles: [Role.User],
      });
      expect(registerSpy).toBeCalledTimes(1);
      expect(registerSpy).toBeCalledWith(data);
    });

    it('Should fail because username already exists', async () => {
      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(
          new HttpException(
            'User with that username already exists',
            HttpStatus.BAD_REQUEST,
          ),
        );

      expect(() =>
        controller.register({
          username: 'Michael',
          email: 'michael@gmail.com',
          password: 'some-password',
        }),
      ).rejects.toThrow('User with that username already exists');
    });

    it('Should fail because email already exists', async () => {
      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(
          new HttpException(
            'User with that email already exists',
            HttpStatus.BAD_REQUEST,
          ),
        );

      expect(() =>
        controller.register({
          username: 'David',
          email: 'david@gmail.com',
          password: 'some-password',
        }),
      ).rejects.toThrow('User with that email already exists');
    });
  });

  describe('sign-in', () => {
    it('Should login an user ', async () => {
      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue('token');

      const token = await controller.login({
        email: 'john@gmail.com',
        password: 'password',
      });

      expect(token).toEqual('token');
      expect(loginSpy).toBeCalledTimes(1);
      expect(loginSpy).toBeCalledWith({
        email: 'john@gmail.com',
        password: 'password',
      });
    });
  });
});
