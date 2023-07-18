import { Role } from '@/models/role.enum';

export interface TokenPayload {
  userId: string;
  roles: Role[];
}
