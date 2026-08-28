import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
@Injectable()
export class LocationsService { constructor(@InjectRepository(Location) private readonly locations: Repository<Location>) {} async findAll() { const items = await this.locations.find({ order: { code: 'ASC' } }); return { items, total: items.length }; } }
