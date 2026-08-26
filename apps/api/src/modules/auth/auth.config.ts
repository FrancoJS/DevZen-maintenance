import { JwtModuleOptions } from '@nestjs/jwt';

export interface JwtConfiguration {
  expiresInSeconds: number;
  secret: string;
}

type Environment = NodeJS.ProcessEnv;

export function readJwtConfiguration(environment: Environment): JwtConfiguration {
  const secret = environment.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 non-whitespace characters',
    );
  }

  const expiresInSeconds = Number(environment.JWT_EXPIRES_IN_SECONDS);
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('JWT_EXPIRES_IN_SECONDS must be a positive integer');
  }

  return { secret, expiresInSeconds };
}

export function toJwtModuleOptions(
  configuration: JwtConfiguration,
): JwtModuleOptions {
  return {
    secret: configuration.secret,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: configuration.expiresInSeconds,
    },
  };
}
