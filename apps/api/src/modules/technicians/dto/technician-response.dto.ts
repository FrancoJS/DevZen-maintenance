import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '../../tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';

export enum TechnicianAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
}

export class TechnicianCurrentTicketResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  asset!: string;

  @ApiProperty({ enum: TicketPriority, enumName: 'TicketPriority' })
  priority!: TicketPriority;

  @ApiProperty({ enum: TicketStatus, enumName: 'TicketStatus' })
  status!: TicketStatus;
}

export class TechnicianResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({
    enum: TechnicianAvailability,
    enumName: 'TechnicianAvailability',
  })
  availability!: TechnicianAvailability;

  @ApiPropertyOptional({ type: () => TechnicianCurrentTicketResponseDto })
  currentTicket!: TechnicianCurrentTicketResponseDto | null;
}

export class PaginatedTechniciansResponseDto {
  @ApiProperty({ type: () => TechnicianResponseDto, isArray: true })
  items!: TechnicianResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
