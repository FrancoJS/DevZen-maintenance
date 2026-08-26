import {
  databaseConnectionOptions,
  nestDatabaseOptions,
} from './database-options';

const environment = {
  POSTGRES_HOST: '127.0.0.1',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'test_user',
  POSTGRES_PASSWORD: 'test_password',
  POSTGRES_DB: 'test_database',
  POSTGRES_SSL: 'false',
  POSTGRES_LOGGING: 'false',
};

describe('databaseConnectionOptions', () => {
  it('creates safe PostgreSQL options with synchronization disabled', () => {
    const options = databaseConnectionOptions(environment);

    expect(options).toMatchObject({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      username: 'test_user',
      database: 'test_database',
      synchronize: false,
      migrationsRun: false,
      logging: false,
    });
    expect(options.password).toBe('test_password');
  });

  it.each([
    ['POSTGRES_HOST', ''],
    ['POSTGRES_PORT', 'invalid'],
    ['POSTGRES_SSL', 'yes'],
  ])('rejects invalid %s', (key, value) => {
    expect(() =>
      databaseConnectionOptions({ ...environment, [key]: value }),
    ).toThrow();
  });

  it('enables automatic entity loading only for Nest', () => {
    expect(nestDatabaseOptions(environment).autoLoadEntities).toBe(true);
  });
});
