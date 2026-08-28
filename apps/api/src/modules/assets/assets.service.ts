import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCatalogResponseDto, AssetSummaryDto } from './dto/asset-catalog-response.dto';
import { Asset } from './entities/asset.entity';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assets: Repository<Asset>,
  ) {}

  async findAll(): Promise<AssetCatalogResponseDto> {
    const items = await this.assets.createQueryBuilder('asset')
      .select('asset.id', 'id')
      .addSelect('asset.assetCode', 'assetCode')
      .addSelect('asset.name', 'name')
      .addSelect('asset.brand', 'brand')
      .addSelect('asset.model', 'model')
      .addSelect('asset.serialNumber', 'serialNumber')
      .addSelect('asset.category', 'category')
      .addSelect('asset.locationId', 'locationId')
      .addSelect(
        'EXISTS (SELECT 1 FROM tickets ticket WHERE ticket.asset_id = asset.id AND ticket.status <> :closedStatus)',
        'hasOpenTicket',
      )
      .where('asset.active = :active', { active: true })
      .setParameter('closedStatus', TicketStatus.CLOSED)
      .orderBy('asset.assetCode', 'ASC')
      .getRawMany<AssetSummaryDto>();

    return { items, total: items.length };
  }
}
