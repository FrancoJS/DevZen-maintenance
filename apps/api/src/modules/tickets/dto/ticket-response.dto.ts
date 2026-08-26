import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketHistoryAction } from '../../history/enums/ticket-history-action.enum';

export class TicketUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ImpactAssessmentResponseDto {
  @ApiProperty()
  safetyRisk!: boolean;

  @ApiProperty({ enum: EquipmentStopped, enumName: 'EquipmentStopped' })
  equipmentStopped!: EquipmentStopped;

  @ApiProperty({ enum: ProductionImpact, enumName: 'ProductionImpact' })
  productionImpact!: ProductionImpact;

  @ApiProperty()
  workaroundAvailable!: boolean;

  @ApiProperty()
  affectsOtherAreas!: boolean;

  @ApiProperty({ enum: TicketPriority, enumName: 'TicketPriority' })
  calculatedPriority!: TicketPriority;
}

export class TicketHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: () => TicketUserResponseDto })
  actor!: TicketUserResponseDto;

  @ApiProperty({ enum: TicketHistoryAction, enumName: 'TicketHistoryAction' })
  action!: TicketHistoryAction;

  @ApiPropertyOptional({ enum: TicketStatus, enumName: 'TicketStatus' })
  previousStatus!: TicketStatus | null;

  @ApiPropertyOptional({ enum: TicketStatus, enumName: 'TicketStatus' })
  newStatus!: TicketStatus | null;

  @ApiPropertyOptional({ enum: TicketPriority, enumName: 'TicketPriority' })
  previousPriority!: TicketPriority | null;

  @ApiPropertyOptional({ enum: TicketPriority, enumName: 'TicketPriority' })
  newPriority!: TicketPriority | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details!: Record<string, unknown> | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class TicketSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  asset!: string;

  @ApiProperty({ enum: TicketPriority, enumName: 'TicketPriority' })
  priority!: TicketPriority;

  @ApiProperty({ enum: TicketStatus, enumName: 'TicketStatus' })
  status!: TicketStatus;

  @ApiProperty({ type: () => TicketUserResponseDto })
  requester!: TicketUserResponseDto;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class TicketDetailResponseDto extends TicketSummaryResponseDto {
  @ApiProperty({ type: () => ImpactAssessmentResponseDto })
  impactAssessment!: ImpactAssessmentResponseDto;

  @ApiProperty({ type: () => TicketHistoryResponseDto, isArray: true })
  history!: TicketHistoryResponseDto[];
}

export class PaginatedTicketsResponseDto {
  @ApiProperty({ type: () => TicketSummaryResponseDto, isArray: true })
  items!: TicketSummaryResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
