import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/enums/user-role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configuration = {
    JWT_SECRET: 'a-development-secret-that-is-longer-than-32-characters',
    JWT_EXPIRES_IN_SECONDS: '28800',
  };
  const configService = {
    get: jest.fn((key: keyof typeof configuration) => configuration[key]),
  } as unknown as ConfigService;
  const strategy = new JwtStrategy(configService);

  it('maps validated payload claims to the authenticated identity', () => {
    expect(
      strategy.validate({ sub: 'user-id', role: UserRole.TECHNICIAN }),
    ).toEqual({ id: 'user-id', role: UserRole.TECHNICIAN });
  });

  it.each([
    [null],
    [{}],
    [{ sub: '', role: UserRole.ADMIN }],
    [{ sub: 'user-id', role: 'UNKNOWN' }],
  ])('rejects an invalid payload', (payload) => {
    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });
});
