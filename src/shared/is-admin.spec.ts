import { randUser } from '@/__test_utils__/user';
import { isAdmin } from './is-admin';
import { Role } from '@/models/role.enum';

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
