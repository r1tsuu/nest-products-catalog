import { Role } from '@/models/roles.enum';

export interface TokenPayload {
  userId: string;
  roles: Role[];
}
