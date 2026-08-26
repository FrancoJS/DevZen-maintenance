import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  const comparePassword = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;
  const usersService = {
    findByEmailForAuthentication: jest.fn(),
  } as unknown as jest.Mocked<Pick<UsersService, 'findByEmailForAuthentication'>>;
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as jest.Mocked<Pick<JwtService, 'signAsync'>>;
  const service = new AuthService(
    usersService as unknown as UsersService,
    jwtService as unknown as JwtService,
  );

  const loginDto = {
    email: 'administrador@luxnova.demo',
    password: 'correct-password',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns a token and safe user data for valid credentials', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(
      Object.assign(new User(), {
        id: 'user-id',
        name: 'Matías Vega',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        role: UserRole.ADMIN,
      }),
    );
    comparePassword.mockResolvedValue(true as never);
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(service.login(loginDto)).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        name: 'Matías Vega',
        email: loginDto.email,
        role: UserRole.ADMIN,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      role: UserRole.ADMIN,
    });
  });

  it('returns a generic unauthorized response when the user does not exist', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(null);

    await expect(service.login(loginDto)).rejects.toEqual(
      new UnauthorizedException('Credenciales inválidas'),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns a generic unauthorized response when the password is incorrect', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(
      Object.assign(new User(), {
        id: 'user-id',
        name: 'Matías Vega',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        role: UserRole.ADMIN,
      }),
    );
    comparePassword.mockResolvedValue(false as never);

    await expect(service.login(loginDto)).rejects.toEqual(
      new UnauthorizedException('Credenciales inválidas'),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
