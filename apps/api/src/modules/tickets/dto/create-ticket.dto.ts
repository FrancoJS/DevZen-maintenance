import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateImpactAssessmentDto } from './create-impact-assessment.dto';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTicketDto {
  @ApiProperty({ maxLength: 1000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  assetId!: string;

  @ApiProperty({ type: () => CreateImpactAssessmentDto })
  @ValidateNested()
  @Type(() => CreateImpactAssessmentDto)
  impactAssessment!: CreateImpactAssessmentDto;
}
