import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it.each([
    [{ email: 'not-an-email', password: 'password' }],
    [{ email: 'user@example.test', password: '' }],
    [{ email: 'user@example.test', password: 123 }],
  ])('rejects invalid credentials', async (value) => {
    const errors = await validate(plainToInstance(LoginDto, value));

    expect(errors).not.toHaveLength(0);
  });

  it('accepts a valid email and non-empty password', async () => {
    const errors = await validate(
      plainToInstance(LoginDto, {
        email: 'user@example.test',
        password: 'password',
      }),
    );

    expect(errors).toHaveLength(0);
  });
});
