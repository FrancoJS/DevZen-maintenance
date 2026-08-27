import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FreezeReasonType } from '../enums/freeze-reason-type.enum';

const normalizeOptionalText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export class RequestFreezeDto {
  @ApiProperty({ enum: FreezeReasonType, enumName: 'FreezeReasonType' })
  @IsEnum(FreezeReasonType)
  reasonType!: FreezeReasonType;

  @ApiPropertyOptional({ nullable: true })
  @Transform(normalizeOptionalText)
  @IsOptional()
  @IsString()
  @ValidateIf(
    (dto: RequestFreezeDto) => dto.reasonType === FreezeReasonType.OTHER,
  )
  @IsNotEmpty()
  reasonDetail?: string | null;
}
