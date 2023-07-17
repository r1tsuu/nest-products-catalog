import { UsersService } from './users.service';
import { User } from './user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { UsersFindOneOptions } from './interfaces/users-find-one-options.interface';
import { Role } from './enums/roles.enum';

const userMock = {
  id: 'test-uuid',
  username: 'John',
  email: 'john@gmail.com',
  password: 'hashed-password',
  roles: [Role.User],
};

const userToCreateMock = {
  username: 'John',
  email: 'john@gmail.com',
  password: 'not-hashed-password',
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest
              .fn()
              .mockImplementation(
                (userOptions: { where: UsersFindOneOptions }) =>
                  Promise.resolve({
                    ...userMock,
                    ...userOptions.where,
                  }),
              ),
            save: jest.fn(),
            create: jest.fn().mockImplementation((userData: CreateUserDTO) =>
              Promise.resolve({
                id: 'test-uuid',
                roles: [Role.User],
                ...userData,
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('Should find a user', async () => {
      const user = await service.findOne();
      expect(user).toEqual(userMock);
    });
  });

  describe('findOneByUsername', () => {
    it('Should find a user by username', async () => {
      const user = await service.findOneByUsername('Michael');
      expect(user).toEqual({
        ...userMock,
        username: 'Michael',
      });
    });
  });

  describe('findOneByEmail', () => {
    it('Should find a user by email', async () => {
      const user = await service.findOneByEmail('michael@gmail.com');
      expect(user).toEqual({
        ...userMock,
        email: 'michael@gmail.com',
      });
    });
  });

  describe('findOneById', () => {
    it('Should find a user by id', async () => {
      const user = await service.findOneById('some-test-uuid');
      expect(user).toEqual({
        ...userMock,
        id: 'some-test-uuid',
      });
    });
  });

  describe('create', () => {
    it('Should create a user', async () => {
      const user = await service.create(userToCreateMock);
      expect(user).toEqual({
        id: expect.any(String),
        ...userToCreateMock,
        roles: [Role.User],
      });
    });

    it('Should create a user with specified role', async () => {
      const user = await service.create({
        ...userToCreateMock,
        roles: [Role.User, Role.Admin],
      });
      expect(user).toEqual({
        id: expect.any(String),
        ...userToCreateMock,
        roles: [Role.User, Role.Admin],
      });
    });
  });
});
