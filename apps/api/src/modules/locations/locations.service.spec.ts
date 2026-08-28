import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  const find = jest.fn();
  const service = new LocationsService({ find } as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns an ordered catalog with only the public location fields', async () => {
    find.mockResolvedValue([
      {
        id: 'location-a',
        code: 'LXN-P1-ENS',
        name: 'Planta 1 · Área de ensamble',
        createdAt: new Date('2026-08-27T00:00:00.000Z'),
        updatedAt: new Date('2026-08-27T00:00:00.000Z'),
        assets: [],
      } satisfies Location,
    ]);

    await expect(service.findAll()).resolves.toEqual({
      items: [
        {
          id: 'location-a',
          code: 'LXN-P1-ENS',
          name: 'Planta 1 · Área de ensamble',
        },
      ],
      total: 1,
    });
    expect(find).toHaveBeenCalledWith({ order: { code: 'ASC' } });
  });
});
