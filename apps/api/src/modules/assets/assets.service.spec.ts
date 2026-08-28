import { AssetSummaryDto } from './dto/asset-catalog-response.dto';
import { AssetsService } from './assets.service';

describe('AssetsService', () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const createQueryBuilder = jest.fn(() => query);
  const service = new AssetsService({ createQueryBuilder } as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns active assets ordered by code with their location relationship', async () => {
    query.getRawMany.mockResolvedValue([
      {
        id: 'asset-a',
        assetCode: 'LXN-ENS-CNV-001',
        name: 'Transportador de rodillos 1',
        brand: 'MecaFlow',
        model: 'MF-R800',
        serialNumber: 'MFR8-2022-1186',
        category: 'Transportador',
        locationId: 'location-a',
        hasOpenTicket: true,
      } satisfies AssetSummaryDto,
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
          hasOpenTicket: true,
        },
      ],
      total: 1,
    });
    expect(query.where).toHaveBeenCalledWith('asset.active = :active', { active: true });
    expect(query.orderBy).toHaveBeenCalledWith('asset.assetCode', 'ASC');
    expect(query.addSelect).toHaveBeenCalledWith(
      'EXISTS (SELECT 1 FROM tickets ticket WHERE ticket.asset_id = asset.id AND ticket.status <> :closedStatus)',
      'hasOpenTicket',
    );
    expect(query.setParameter).toHaveBeenCalledWith('closedStatus', 'CLOSED');
    expect(query.getRawMany).toHaveBeenCalledTimes(1);
  });

  it('preserves false for free assets and supports an empty catalog', async () => {
    query.getRawMany.mockResolvedValueOnce([{ id: 'free-asset', hasOpenTicket: false }]);
    expect((await service.findAll()).items[0].hasOpenTicket).toBe(false);
    query.getRawMany.mockResolvedValueOnce([]);
    await expect(service.findAll()).resolves.toEqual({ items: [], total: 0 });
  });
});
