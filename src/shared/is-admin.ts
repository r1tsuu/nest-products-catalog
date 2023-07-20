import { User } from '@/users/user.entity';
import { Role } from '@/users/interfaces/role.enum';

export const isAdmin = (user: User) => user.roles.includes(Role.Admin);
