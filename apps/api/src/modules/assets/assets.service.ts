import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCatalogResponseDto } from './dto/asset-catalog-response.dto';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assets: Repository<Asset>,
  ) {}

  async findAll(): Promise<AssetCatalogResponseDto> {
    const assets = await this.assets.find({
      where: { active: true },
      order: { assetCode: 'ASC' },
    });
    const items = assets.map(({ id, assetCode, name, locationId }) => ({
      id,
      assetCode,
      name,
      locationId,
    }));

    return { items, total: items.length };
  }
}
