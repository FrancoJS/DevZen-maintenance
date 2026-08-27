import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketDetailResponseDto } from './ticket-response.dto';

export class CurrentMaintenanceResponseDto {
  @ApiPropertyOptional({ type: () => TicketDetailResponseDto })
  ticket!: TicketDetailResponseDto | null;
}
