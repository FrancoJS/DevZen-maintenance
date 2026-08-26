import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const getOne = jest.fn();
  const where = jest.fn(() => ({ getOne }));
  const addSelect = jest.fn(() => ({ where }));
  const createQueryBuilder = jest.fn(() => ({ addSelect }));
  const findOne = jest.fn();
  const service = new UsersService({
    createQueryBuilder,
    findOne,
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes email and explicitly selects the password hash for authentication', async () => {
    getOne.mockResolvedValue(null);

    await service.findByEmailForAuthentication(' ADMIN@LUXNOVA.DEMO ');

    expect(createQueryBuilder).toHaveBeenCalledWith('user');
    expect(addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(where).toHaveBeenCalledWith(
      'LOWER(user.email) = LOWER(:email)',
      { email: 'admin@luxnova.demo' },
    );
  });

  it('retrieves a user without explicitly selecting the password hash', async () => {
    const user = { id: 'user-id' } as User;
    findOne.mockResolvedValue(user);

    await expect(service.findSafeById('user-id')).resolves.toBe(user);
    expect(findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(addSelect).not.toHaveBeenCalled();
  });
});
