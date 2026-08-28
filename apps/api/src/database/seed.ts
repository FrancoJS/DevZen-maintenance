import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';
import { Location } from '../modules/locations/entities/location.entity';
import { Asset } from '../modules/assets/entities/asset.entity';

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

const seedLocations = [
  { code: 'LXN-P1-ENV', name: 'Planta 1 · Línea de envasado' },
  { code: 'LXN-P1-ENS', name: 'Planta 1 · Área de ensamble' },
  { code: 'LXN-BOD-REP', name: 'Bodega · Recepción de materiales' },
] as const;

const seedAssets = [
  {
    assetCode: 'LXN-ENV-PRN-004',
    name: 'Prensa hidráulica 4',
    brand: 'HidroPress',
    model: 'HP-400',
    serialNumber: 'HP4-2024-7815',
    category: 'Prensa hidráulica',
    locationCode: 'LXN-P1-ENV',
    active: true,
  },
  {
    assetCode: 'LXN-ENV-ETQ-002',
    name: 'Etiquetadora automática 2',
    brand: 'LabelPro',
    model: 'LP-220',
    serialNumber: 'LP2-2023-4390',
    category: 'Etiquetadora',
    locationCode: 'LXN-P1-ENV',
    active: true,
  },
  {
    assetCode: 'LXN-ENS-CNV-001',
    name: 'Transportador de rodillos 1',
    brand: 'MecaFlow',
    model: 'MF-R800',
    serialNumber: 'MFR8-2022-1186',
    category: 'Transportador',
    locationCode: 'LXN-P1-ENS',
    active: true,
  },
  {
    assetCode: 'LXN-BOD-BAL-001',
    name: 'Balanza industrial 1',
    brand: 'PesoMax',
    model: 'PM-1500',
    serialNumber: 'PM15-2021-6704',
    category: 'Balanza industrial',
    locationCode: 'LXN-BOD-REP',
    active: true,
  },
  {
    assetCode: 'LXN-ENS-TOR-003',
    name: 'Torno CNC 3',
    brand: 'TecnoMaq',
    model: 'TM-CNC450',
    serialNumber: 'TMC3-2020-2917',
    category: 'Torno CNC',
    locationCode: 'LXN-P1-ENS',
    active: false,
  },
] as const;

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
      const locations = manager.getRepository(Location);
      const assets = manager.getRepository(Asset);
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

      for (const seedLocation of seedLocations) {
        const existing = await locations.findOne({
          where: { code: seedLocation.code },
        });
        await locations.save(
          locations.create({
            ...(existing ?? {}),
            ...seedLocation,
          }),
        );
      }

      const locationByCode = new Map(
        (await locations.find()).map((location) => [location.code, location]),
      );
      for (const seedAsset of seedAssets) {
        const location = locationByCode.get(seedAsset.locationCode);
        if (!location) {
          throw new Error(`Seed location not found: ${seedAsset.locationCode}`);
        }
        const existing = await assets.findOne({
          where: { assetCode: seedAsset.assetCode },
        });
        const { locationCode: _locationCode, ...assetData } = seedAsset;
        await assets.save(
          assets.create({
            ...(existing ?? {}),
            ...assetData,
            locationId: location.id,
          }),
        );
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
