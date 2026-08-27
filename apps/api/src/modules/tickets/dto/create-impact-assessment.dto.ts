import { IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';

export class CreateImpactAssessmentDto {
  @ApiProperty()
  @IsBoolean()
  safetyRisk!: boolean;

  @ApiProperty({ enum: EquipmentStopped, enumName: 'EquipmentStopped' })
  @IsEnum(EquipmentStopped)
  equipmentStopped!: EquipmentStopped;

  @ApiProperty({ enum: ProductionImpact, enumName: 'ProductionImpact' })
  @IsEnum(ProductionImpact)
  productionImpact!: ProductionImpact;

  @ApiProperty()
  @IsBoolean()
  workaroundAvailable!: boolean;

  @ApiProperty()
  @IsBoolean()
  affectsOtherAreas!: boolean;
}
