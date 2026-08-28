import { ApiProperty } from '@nestjs/swagger';

export class AssetSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  assetCode!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  locationId!: string;
}

export class AssetCatalogResponseDto {
  @ApiProperty({ type: () => AssetSummaryDto, isArray: true })
  items!: AssetSummaryDto[];

  @ApiProperty()
  total!: number;
}
