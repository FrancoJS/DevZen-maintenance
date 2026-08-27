import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { FreezeRequestsResponseDto } from './dto/freeze-request-list-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Congelamientos')
@ApiBearerAuth('access-token')
@Controller('freeze-requests')
export class FreezeRequestsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar solicitudes de congelamiento' })
  @ApiOkResponse({ type: FreezeRequestsResponseDto })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FreezeRequestsResponseDto> {
    return this.ticketsService.findAllFreezeRequests(currentUser);
  }
}
