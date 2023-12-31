import { hash } from 'bcrypt';
import * as request from 'supertest';
import { randText } from '@ngneat/falso';
import { randEmail } from '@ngneat/falso';

import { Role } from '@/users/interfaces/role.enum';
import { User } from '@/users/user.entity';

export const randRegisterData = () => ({
  username: randText(),
  email: randEmail(),
  password: randText(),
});

export type Auth = { entity: User; auth: [string, { type: 'bearer' }] };

export const getAuth = async (
  usersRepo: any,
  app: any,
  roles: Role[],
): Promise<Auth> => {
  const registerData = randRegisterData();
  const password = await hash(registerData.password, 10);

  const entity = await usersRepo.save({
    ...registerData,
    password,
    roles,
  });

  const response = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({
      email: registerData.email,
      password: registerData.password,
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.user.id).toBe(entity.id);
      expect(res.body.accessToken).toBeTruthy();
    });

  const accessToken = response.body.accessToken;

  return { auth: [accessToken, { type: 'bearer' }], entity };
};
