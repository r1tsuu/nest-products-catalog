import { Role } from '@/users/interfaces/role.enum';
import { User } from '@/users/user.entity';
import { randEmail, randPassword, randUserName, randUuid } from '@ngneat/falso';

export const randUser = (): User => ({
  username: randUserName(),
  id: randUuid(),
  email: randEmail(),
  password: randPassword(),
  roles: [Role.User],
  orders: [],
});
