import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
@ApiTags('Locations') @ApiBearerAuth('access-token') @Controller('locations')
export class LocationsController { constructor(private readonly locations: LocationsService) {} @Get() @ApiOkResponse() findAll() { return this.locations.findAll(); } }
