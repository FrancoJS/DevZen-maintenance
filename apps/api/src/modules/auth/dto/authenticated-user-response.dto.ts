import { UserRole } from '../../users/enums/user-role.enum';

export class AuthenticatedUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
}
