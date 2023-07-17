import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/enums/roles.enum';

export const HasRoles = (...roles: Role[]) => SetMetadata('roles', roles);
