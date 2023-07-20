import { SetMetadata } from '@nestjs/common';

import { Role } from '@/users/interfaces/role.enum';

export const HasRoles = (...roles: Role[]) => SetMetadata('roles', roles);
