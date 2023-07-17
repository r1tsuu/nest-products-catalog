import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ClassSerializerInterceptor,
  HttpStatus,
  INestApplication,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { v4 } from 'uuid';
import { ProductsModule } from '../src/app/products/products.module';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { Reflector } from '@nestjs/core';
import { User } from '../src/app/users/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/app/users/enums/roles.enum';
import { Product } from '../src/app/products/product.entity';

import { AuthModule } from '../src/app/auth/auth.module';
import { dbModule } from './db';

const mockUser = {
  username: 'username',
  email: 'test@email.com',
  password: 'Password123',
};

const mockAdmin = {
  username: 'admin22',
  email: 'admin@email.com',
  password: 'admin-password',
};

const mockProducts = [
  {
    title: 'Iphone 3',
    photo: 'https://example.com/photo.jpg',
    price: 1000,
    slug: 'iphone-3',
  },
  {
    title: 'Samsung 2',
    photo: 'https://example.com/photo.jpg',
    price: 1200,
    slug: 'samsung-2',
  },
];

const mockProduct = { ...mockProducts[0] };

describe('ProductModule (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;

  let productsRepo: Repository<Product>;
  let accessTokenUser: string;
  let accessTokenAdmin: string;

  type Auth = [string, { type: 'bearer' }];
  let authUser: Auth;
  let authAdmin: Auth;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        AuthModule,
        ProductsModule,
        dbModule('products', User, Product),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    usersRepo = moduleRef.get(getRepositoryToken(User));
    productsRepo = moduleRef.get(getRepositoryToken(Product));

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.init();

    app.useLogger(new Logger());
  });

  beforeEach(async () => {
    await usersRepo.clear();
    await productsRepo.clear();

    const passwordUser = await bcrypt.hash(mockUser.password, 10);
    const passwordAdmin = await bcrypt.hash(mockAdmin.password, 10);

    await usersRepo.save({
      ...mockUser,
      password: passwordUser,
      roles: [Role.User],
    });

    await usersRepo.save({
      ...mockAdmin,
      password: passwordAdmin,
      roles: [Role.User, Role.Admin],
    });

    const responseUser = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200)
      .expect((res) =>
        expect(res.body).toEqual({ access_token: expect.any(String) }),
      );

    accessTokenUser = responseUser.body.access_token;

    authUser = [accessTokenUser, { type: 'bearer' }];
    const responseAdmin = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: mockAdmin.email, password: mockAdmin.password })
      .expect(200)
      .expect((res) =>
        expect(res.body).toEqual({ access_token: expect.any(String) }),
      );

    accessTokenAdmin = responseAdmin.body.access_token;

    authAdmin = [accessTokenAdmin, { type: 'bearer' }];
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('GET /product', () => {
    it('Should return all products', async () => {
      const products = await productsRepo.save(mockProducts);
      await request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => expect(res.body).toEqual(products));
    });
  });

  describe('GET /products/id/:id', () => {
    it('Should return a product by id', async () => {
      const productData = await productsRepo.save(mockProduct);
      await request(app.getHttpServer())
        .get(`/products/id/${productData.id}`)
        .expect((res) => expect(res.body).toEqual(productData));
    });
  });

  describe('GET /products/slug/:slug', () => {
    it('Should return a product by slug', async () => {
      const slug = 'test-slug';
      const product = {
        title: 'Galaxy S1',
        price: 500,
        photo: 'photo',
        slug,
      };

      await productsRepo.save([...mockProducts, product]);
      await request(app.getHttpServer())
        .get(`/products/slug/${slug}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({ ...product, id: expect.any(String) }),
        );
    });
  });

  describe('POST /products Auth Admin', () => {
    it('Should create a product ', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .auth(...authAdmin)
        .send(mockProduct)
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({ ...mockProduct, id: expect.any(String) }),
        );
    });
    it('Should create a product with generated slug', async () => {
      const mockProductSend = {
        title: 'some Title test',
        price: 300,
        photo: 'https://example.com/photo.png',
      };
      await request(app.getHttpServer())
        .post('/products')
        .auth(...authAdmin)
        .send(mockProductSend)
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            ...mockProductSend,
            slug: 'some-Title-test',
            id: expect.any(String),
          }),
        );
    });
  });

  describe('PUT /products/:id Auth Admin', () => {
    it('Should update a product', async () => {
      const product = await productsRepo.save({
        title: 'some Title test',
        price: 300,
        photo: 'https://example.com/photo.png',
        slug: 'some-slug',
      });

      await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .auth(...authAdmin)
        .send({
          price: 1000,
          photo: 'new-photo',
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            ...product,
            price: 1000,
            photo: 'new-photo',
          }),
        );
    });
    it('Should update a product and regenerate slug', async () => {
      const product = await productsRepo.save({
        title: 'some Title test',
        price: 300,
        photo: 'https://example.com/photo.png',
        // generated by title
        slug: 'some-Title-test',
      });

      await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .auth(...authAdmin)
        .send({
          title: 'new title updated',
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            ...product,
            title: 'new title updated',
            slug: 'new-title-updated',
          }),
        );
    });

    it('Should update a product without regenerating slug', async () => {
      const product = await productsRepo.save({
        title: 'some Title test',
        price: 300,
        photo: 'https://example.com/photo.png',
        slug: 'not-generated-slug',
      });

      await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .auth(...authAdmin)
        .send({
          title: 'new title updated',
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            ...product,
            title: 'new title updated',
          }),
        );
    });

    it('Should not update a not existing product', async () => {
      await request(app.getHttpServer())
        .put(`/products/${v4()}`)
        .auth(...authAdmin)
        .send({
          title: 'new title updated',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) =>
          expect(res.body.message).toEqual(
            'Product with that id has not been found',
          ),
        );
    });
  });

  describe('DELETE /products/:id Auth Admin', () => {
    it('Should delete a product by id ', async () => {
      const product = await productsRepo.save(mockProduct);

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .auth(...authAdmin)
        .expect(200)
        .expect((res) => expect(res.body).toEqual({ deleted: true }));
    });

    it('Should not delete a product by id because of db error', async () => {
      const product = await productsRepo.save(mockProduct);
      jest.spyOn(productsRepo, 'delete').mockRejectedValue(new Error());

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .auth(...authAdmin)
        .expect(200)
        .expect((res) => expect(res.body).toEqual({ deleted: false }));
    });
  });
});
