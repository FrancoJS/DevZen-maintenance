import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';

export class LoginResponseDto {
  accessToken!: string;
  user!: AuthenticatedUserResponseDto;
}
