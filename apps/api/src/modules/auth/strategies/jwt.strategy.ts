import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../users/enums/user-role.enum';
import { readJwtConfiguration } from '../auth.config';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const configuration = readJwtConfiguration({
      JWT_SECRET: configService.get<string>('JWT_SECRET'),
      JWT_EXPIRES_IN_SECONDS: configService.get<string>(
        'JWT_EXPIRES_IN_SECONDS',
      ),
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration.secret,
      algorithms: ['HS256'],
    });
  }

  validate(payload: unknown): AuthenticatedUser {
    if (!this.isJwtPayload(payload)) {
      throw new UnauthorizedException('Token inválido');
    }

    return { id: payload.sub, role: payload.role };
  }

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as Partial<JwtPayload>;
    return (
      typeof candidate.sub === 'string' &&
      candidate.sub.length > 0 &&
      Object.values(UserRole).includes(candidate.role as UserRole)
    );
  }
}
