import { UserRole } from '../../users/enums/user-role.enum';

export interface JwtPayload {
  role: UserRole;
  sub: string;
}
