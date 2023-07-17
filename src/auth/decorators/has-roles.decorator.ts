import { Role } from '@/models/roles.enum';
import { SetMetadata } from '@nestjs/common';

export const HasRoles = (...roles: Role[]) => SetMetadata('roles', roles);
