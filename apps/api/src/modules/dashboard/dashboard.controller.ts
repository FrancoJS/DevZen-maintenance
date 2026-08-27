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
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener indicadores administrativos' })
  @ApiOkResponse({ type: AdminDashboardResponseDto })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  findAdmin(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AdminDashboardResponseDto> {
    return this.dashboardService.findAdmin(currentUser);
  }
}
