import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationCatalogResponseDto } from './dto/location-catalog-response.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  async findAll(): Promise<LocationCatalogResponseDto> {
    const locations = await this.locations.find({ order: { code: 'ASC' } });
    const items = locations.map(({ id, code, name }) => ({ id, code, name }));

    return { items, total: items.length };
  }
}
