import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

type Environment = NodeJS.ProcessEnv;
type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

function required(env: Environment, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function integer(env: Environment, key: string): number {
  const value = Number(required(env, key));
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Environment variable ${key} must be a valid port number`);
  }
  return value;
}

function boolean(env: Environment, key: string, fallback = false): boolean {
  const value = env[key];
  if (value === undefined || value === '') {
    return fallback;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`Environment variable ${key} must be true or false`);
}

export function databaseConnectionOptions(
  env: Environment,
): Omit<PostgresOptions, 'entities'> {
  return {
    type: 'postgres',
    host: required(env, 'POSTGRES_HOST'),
    port: integer(env, 'POSTGRES_PORT'),
    username: required(env, 'POSTGRES_USER'),
    password: required(env, 'POSTGRES_PASSWORD'),
    database: required(env, 'POSTGRES_DB'),
    ssl: boolean(env, 'POSTGRES_SSL') ? { rejectUnauthorized: true } : false,
    logging: boolean(env, 'POSTGRES_LOGGING'),
    synchronize: false,
    migrationsRun: false,
    migrationsTableName: 'typeorm_migrations',
    migrationsTransactionMode: 'all',
    uuidExtension: 'pgcrypto',
    invalidWhereValuesBehavior: {
      null: 'throw',
      undefined: 'throw',
    },
  };
}

export function nestDatabaseOptions(env: Environment): TypeOrmModuleOptions {
  return {
    ...databaseConnectionOptions(env),
    autoLoadEntities: true,
  };
}
