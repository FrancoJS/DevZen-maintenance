import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  me(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AuthenticatedUserResponseDto> {
    return this.authService.getCurrentUser(currentUser.id);
  }
}
