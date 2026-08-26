import { readJwtConfiguration, toJwtModuleOptions } from './auth.config';

const validEnvironment = {
  JWT_SECRET: 'a-development-secret-that-is-longer-than-32-characters',
  JWT_EXPIRES_IN_SECONDS: '28800',
};

describe('readJwtConfiguration', () => {
  it('returns a validated HS256 configuration', () => {
    const configuration = readJwtConfiguration(validEnvironment);

    expect(configuration).toEqual({
      secret: validEnvironment.JWT_SECRET,
      expiresInSeconds: 28800,
    });
    expect(toJwtModuleOptions(configuration)).toMatchObject({
      secret: validEnvironment.JWT_SECRET,
      signOptions: { algorithm: 'HS256', expiresIn: 28800 },
    });
  });

  it.each([
    ['JWT_SECRET', ''],
    ['JWT_SECRET', 'too-short'],
    ['JWT_EXPIRES_IN_SECONDS', ''],
    ['JWT_EXPIRES_IN_SECONDS', 'not-a-number'],
    ['JWT_EXPIRES_IN_SECONDS', '0'],
  ])('rejects an invalid %s value', (key, value) => {
    expect(() =>
      readJwtConfiguration({ ...validEnvironment, [key]: value }),
    ).toThrow();
  });
});
