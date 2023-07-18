import { Role } from '@/models/role.enum';
import { User } from '@/models/user.entity';
import { randEmail, randPassword, randUserName, randUuid } from '@ngneat/falso';

export const randUser = (): User => ({
  username: randUserName(),
  id: randUuid(),
  email: randEmail(),
  password: randPassword(),
  roles: [Role.User],
  orders: [],
});
