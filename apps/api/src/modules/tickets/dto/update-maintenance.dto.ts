import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function normalizeOptionalText({ value }: { value: unknown }): unknown {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  return value;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ nullable: true })
  @Transform(normalizeOptionalText)
  @IsOptional()
  @IsString()
  diagnosis?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(normalizeOptionalText)
  @IsOptional()
  @IsString()
  workPerformed?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(normalizeOptionalText)
  @IsOptional()
  @IsString()
  notes?: string | null;
}
