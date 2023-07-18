import { User } from '@/models/user.entity';
import { randUserName } from '@ngneat/falso';
import { randEmail } from '@ngneat/falso';
import { randPassword } from '@ngneat/falso';

export const randUserToSave = () => ({
  username: randUserName(),
  email: randEmail(),
  password: randPassword(),
});
