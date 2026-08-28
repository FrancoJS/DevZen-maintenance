import { ApiProperty } from '@nestjs/swagger';

export class LocationSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class LocationCatalogResponseDto {
  @ApiProperty({ type: () => LocationSummaryDto, isArray: true })
  items!: LocationSummaryDto[];

  @ApiProperty()
  total!: number;
}
