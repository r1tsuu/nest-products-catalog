import { randUser } from '@/__test_utils__/user';
import { Role } from '@/users/interfaces/role.enum';

import { isAdmin } from './is-admin';

describe('isAdmin', () => {
  it('Should return true', () => {
    const user_1 = { ...randUser(), roles: [Role.User, Role.Admin] };
    expect(isAdmin(user_1)).toBe(true);
    const user_2 = { ...randUser(), roles: [Role.Admin] };
    expect(isAdmin(user_2)).toBe(true);
  });

  it('Should return false', () => {
    const user = randUser();
    expect(isAdmin(user)).toBe(false);
  });
});
