import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AssetCatalogResponseDto } from './dto/asset-catalog-response.dto';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @ApiOkResponse({ type: AssetCatalogResponseDto })
  findAll(): Promise<AssetCatalogResponseDto> {
    return this.assets.findAll();
  }
}
