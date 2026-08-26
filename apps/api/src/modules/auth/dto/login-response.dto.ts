import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: () => AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;
}
