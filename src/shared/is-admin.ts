import { Role } from '@/models/role.enum';
import { User } from '@/models/user.entity';

export const isAdmin = (user: User) => user.roles.includes(Role.Admin);
