import { UserRole } from '../users/enums/user-role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  } as unknown as jest.Mocked<Pick<AuthService, 'login'>>;
  const controller = new AuthController(authService as unknown as AuthService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('delegates a login request to the authentication service', async () => {
    const loginDto = {
      email: 'solicitante@luxnova.demo',
      password: 'password',
    };
    const response = {
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        name: 'Sofía Rojas',
        email: loginDto.email,
        role: UserRole.REQUESTER,
      },
    };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(loginDto)).resolves.toEqual(response);
    expect(authService.login).toHaveBeenCalledWith(loginDto);
  });

  it('retrieves the current authenticated user', async () => {
    const response = {
      id: 'user-id',
      name: 'Sofía Rojas',
      email: 'solicitante@luxnova.demo',
      role: UserRole.REQUESTER,
    };
    (authService as unknown as { getCurrentUser: jest.Mock }).getCurrentUser =
      jest.fn().mockResolvedValue(response);

    await expect(
      controller.me({ id: 'user-id', role: UserRole.REQUESTER }),
    ).resolves.toEqual(response);
  });
});
