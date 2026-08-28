import { Asset } from './entities/asset.entity';
import { AssetsService } from './assets.service';

describe('AssetsService', () => {
  const find = jest.fn();
  const service = new AssetsService({ find } as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns active assets ordered by code with their location relationship', async () => {
    find.mockResolvedValue([
      {
        id: 'asset-a',
        assetCode: 'LXN-ENS-CNV-001',
        name: 'Transportador de rodillos 1',
        brand: 'MecaFlow',
        model: 'MF-R800',
        serialNumber: 'MFR8-2022-1186',
        category: 'Transportador',
        locationId: 'location-a',
        active: true,
        createdAt: new Date('2026-08-27T00:00:00.000Z'),
        updatedAt: new Date('2026-08-27T00:00:00.000Z'),
        location: {} as never,
        tickets: [],
      } satisfies Asset,
    ]);

    await expect(service.findAll()).resolves.toEqual({
      items: [
        {
          id: 'asset-a',
          assetCode: 'LXN-ENS-CNV-001',
          name: 'Transportador de rodillos 1',
          brand: 'MecaFlow',
          model: 'MF-R800',
          serialNumber: 'MFR8-2022-1186',
          category: 'Transportador',
          locationId: 'location-a',
        },
      ],
      total: 1,
    });
    expect(find).toHaveBeenCalledWith({
      where: { active: true },
      order: { assetCode: 'ASC' },
    });
  });
});
