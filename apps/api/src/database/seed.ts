import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';

const seedUsers: ReadonlyArray<Pick<User, 'name' | 'email' | 'role'>> = [
  {
    name: 'Sofía Rojas',
    email: 'solicitante@luxnova.demo',
    role: UserRole.REQUESTER,
  },
  {
    name: 'Matías Vega',
    email: 'administrador@luxnova.demo',
    role: UserRole.ADMIN,
  },
  {
    name: 'Camila Soto',
    email: 'tecnico.uno@luxnova.demo',
    role: UserRole.TECHNICIAN,
  },
  {
    name: 'Diego Pérez',
    email: 'tecnico.dos@luxnova.demo',
    role: UserRole.TECHNICIAN,
  },
];

async function seed(): Promise<void> {
  if (
    !['development', 'test'].includes(process.env.NODE_ENV ?? 'development')
  ) {
    throw new Error(
      'The development seed can only run in development or test environments',
    );
  }

  const password = process.env.SEED_DEFAULT_PASSWORD;
  if (!password) {
    throw new Error(
      'Missing required environment variable: SEED_DEFAULT_PASSWORD',
    );
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      for (const seedUser of seedUsers) {
        const email = seedUser.email.toLowerCase();
        const existing = await users
          .createQueryBuilder('user')
          .addSelect('user.passwordHash')
          .where('LOWER(user.email) = LOWER(:email)', { email })
          .getOne();

        if (!existing) {
          await users.save(
            users.create({
              ...seedUser,
              email,
              passwordHash: await bcrypt.hash(password, 12),
            }),
          );
        }
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
