import { UserRole } from '../../users/enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
