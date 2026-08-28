import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketHistoryAction } from '../../history/enums/ticket-history-action.enum';
import { AssignmentReleaseReason } from '../enums/assignment-release-reason.enum';
import { FreezeReasonType } from '../enums/freeze-reason-type.enum';
import { FreezeRequestStatus } from '../enums/freeze-request-status.enum';

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

export class AssignmentHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: () => TicketUserResponseDto })
  technician!: TicketUserResponseDto;

  @ApiProperty({ type: () => TicketUserResponseDto })
  assignedBy!: TicketUserResponseDto;

  @ApiProperty({ format: 'date-time' })
  assignedAt!: Date;

  @ApiPropertyOptional({ format: 'date-time' })
  startedAt!: Date | null;

  @ApiPropertyOptional({ format: 'date-time' })
  releasedAt!: Date | null;

  @ApiPropertyOptional({
    enum: AssignmentReleaseReason,
    enumName: 'AssignmentReleaseReason',
  })
  releaseReason!: AssignmentReleaseReason | null;
}

export class FreezeRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: () => TicketUserResponseDto })
  technician!: TicketUserResponseDto;

  @ApiProperty({ enum: FreezeReasonType, enumName: 'FreezeReasonType' })
  reasonType!: FreezeReasonType;

  @ApiPropertyOptional({ nullable: true })
  reasonDetail!: string | null;

  @ApiProperty({ enum: FreezeRequestStatus, enumName: 'FreezeRequestStatus' })
  status!: FreezeRequestStatus;

  @ApiProperty({ format: 'date-time' })
  requestedAt!: Date;

  @ApiPropertyOptional({ type: () => TicketUserResponseDto })
  reviewedBy!: TicketUserResponseDto | null;

  @ApiPropertyOptional({ format: 'date-time' })
  reviewedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewNote!: string | null;
}

export class MaintenanceResponseDto {
  @ApiPropertyOptional({ nullable: true })
  diagnosis!: string | null;

  @ApiPropertyOptional({ nullable: true })
  workPerformed!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}
export class TicketEvidenceResponseDto { @ApiProperty({ format: 'uuid' }) id!: string; @ApiProperty() publicId!: string; @ApiProperty() mimeType!: string; @ApiProperty() size!: number; @ApiProperty() originalFilename!: string; @ApiProperty({ format: 'date-time' }) createdAt!: Date; @ApiProperty({ type: () => TicketUserResponseDto }) technician!: TicketUserResponseDto; @ApiPropertyOptional({ nullable: true }) accessUrl!: string | null; }

export class TicketSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  ticketCode!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  asset!: string;

  @ApiProperty({ format: 'uuid' }) assetId!: string;
  @ApiProperty() assetCode!: string;
  @ApiProperty({ format: 'uuid' }) locationId!: string;
  @ApiProperty() locationCode!: string;

  @ApiProperty({ enum: TicketPriority, enumName: 'TicketPriority' })
  priority!: TicketPriority;

  @ApiProperty({ enum: TicketStatus, enumName: 'TicketStatus' })
  status!: TicketStatus;

  @ApiProperty({ type: () => TicketUserResponseDto })
  requester!: TicketUserResponseDto;

  @ApiPropertyOptional({ type: () => TicketUserResponseDto })
  currentTechnician!: TicketUserResponseDto | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class TicketDetailResponseDto extends TicketSummaryResponseDto {

  @ApiPropertyOptional({ type: () => TicketUserResponseDto })
  resolvedBy!: TicketUserResponseDto | null;

  @ApiPropertyOptional({ format: 'date-time' })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ type: () => TicketUserResponseDto })
  closedBy!: TicketUserResponseDto | null;

  @ApiPropertyOptional({ format: 'date-time' })
  closedAt!: Date | null;

  @ApiProperty({ type: () => ImpactAssessmentResponseDto })
  impactAssessment!: ImpactAssessmentResponseDto;

  @ApiProperty({ type: () => AssignmentHistoryResponseDto, isArray: true })
  assignments!: AssignmentHistoryResponseDto[];

  @ApiProperty({ type: () => FreezeRequestResponseDto, isArray: true })
  freezeRequests!: FreezeRequestResponseDto[];

  @ApiPropertyOptional({ type: () => MaintenanceResponseDto })
  maintenance!: MaintenanceResponseDto | null;

  @ApiProperty({ type: () => TicketEvidenceResponseDto, isArray: true })
  finalEvidence!: TicketEvidenceResponseDto[];

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

export class GlobalTicketHistoryResponseDto {
  @ApiProperty({ type: () => TicketDetailResponseDto, isArray: true })
  items!: TicketDetailResponseDto[];
  @ApiProperty() total!: number;
}
