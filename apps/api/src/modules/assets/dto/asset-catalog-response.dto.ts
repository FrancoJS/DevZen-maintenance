import { ApiProperty } from '@nestjs/swagger';

export class AssetSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  assetCode!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  brand!: string;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  serialNumber!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ format: 'uuid' })
  locationId!: string;

  @ApiProperty({ description: 'Existe un ticket no cerrado para esta máquina, sin importar su solicitante.' })
  hasOpenTicket!: boolean;
}

export class AssetCatalogResponseDto {
  @ApiProperty({ type: () => AssetSummaryDto, isArray: true })
  items!: AssetSummaryDto[];

  @ApiProperty()
  total!: number;
}
