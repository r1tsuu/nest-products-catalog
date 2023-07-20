import { Role } from '@/users/interfaces/role.enum';

export interface TokenPayload {
  userId: string;
  roles: Role[];
}
