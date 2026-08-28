import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocationCatalogResponseDto } from './dto/location-catalog-response.dto';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  @ApiOkResponse({ type: LocationCatalogResponseDto })
  findAll(): Promise<LocationCatalogResponseDto> {
    return this.locations.findAll();
  }
}
