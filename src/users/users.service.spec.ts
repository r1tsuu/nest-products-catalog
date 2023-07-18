import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/models/user.entity';
import { Role } from '@/models/role.enum';
import { randUser } from '@/__test_utils__/user';

import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockImplementation((value) => value),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('Should find a user', async () => {
      const userData = randUser();
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValue(userData);

      const user = await service.findOne();

      expect(user).toEqual(userData);
      expect(findOneSpy).toBeCalledTimes(1);
      expect(findOneSpy).toBeCalledWith({
        relations: { orders: true },
      });
    });

    it('Should find a user by provided options', async () => {
      const userData = randUser();
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValue(userData);
      const { email, roles } = userData;
      const options = { email, roles };

      const user = await service.findOne(options);

      expect(user).toEqual(userData);
      expect(findOneSpy).toBeCalledWith({
        where: options,
        relations: { orders: true },
      });
    });
  });

  describe('findOneByUsername', () => {
    it('Should find a user by username', async () => {
      const userData = randUser();
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(userData);
      const { username } = userData;

      const user = await service.findOneByUsername(username);

      expect(user).toEqual(userData);
      expect(findOneSpy).toBeCalledWith({ username });
    });
  });

  describe('findOneByEmail', () => {
    it('Should find a user by email', async () => {
      const userData = randUser();
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(userData);
      const { email } = userData;

      const user = await service.findOneByEmail(email);

      expect(user).toEqual(userData);
      expect(findOneSpy).toBeCalledWith({ email });
    });
  });

  describe('findOneById', () => {
    it('Should find a user by id', async () => {
      const userData = randUser();
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(userData);
      const { id } = userData;

      const user = await service.findOneById(id);

      expect(user).toEqual(userData);
      expect(findOneSpy).toBeCalledWith({ id });
    });
  });

  describe('create', () => {
    it('Should create a user', async () => {
      const userData = randUser();
      const dataToCreate = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      };
      const createSpy = jest.spyOn(repo, 'create');
      const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(userData);

      const user = await service.create(dataToCreate);

      expect(user).toEqual(userData);
      expect(createSpy).toBeCalledWith(dataToCreate);
      expect(saveSpy).toBeCalledWith(dataToCreate);
    });

    it('Should create a user with specified role', async () => {
      const userData = { ...randUser(), roles: [Role.User, Role.Admin] };
      const dataToCreate = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        roles: userData.roles,
      };
      const createSpy = jest.spyOn(repo, 'create');
      const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(userData);
      const user = await service.create(dataToCreate);

      expect(user).toEqual(userData);
      expect(createSpy).toBeCalledWith(dataToCreate);
      expect(saveSpy).toBeCalledWith(dataToCreate);
    });
  });
});
