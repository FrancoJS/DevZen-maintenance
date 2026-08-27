import { ApiProperty } from '@nestjs/swagger';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { FreezeRequestResponseDto } from './ticket-response.dto';

export class FreezeRequestTicketResponseDto {
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

export class FreezeRequestListItemResponseDto extends FreezeRequestResponseDto {
  @ApiProperty({ type: () => FreezeRequestTicketResponseDto })
  ticket!: FreezeRequestTicketResponseDto;
}

export class FreezeRequestsResponseDto {
  @ApiProperty({ type: () => FreezeRequestListItemResponseDto, isArray: true })
  items!: FreezeRequestListItemResponseDto[];

  @ApiProperty()
  total!: number;
}
