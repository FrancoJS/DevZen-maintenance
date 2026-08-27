import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ListTechniciansQueryDto } from './dto/list-technicians-query.dto';
import { PaginatedTechniciansResponseDto } from './dto/technician-response.dto';
import { TechniciansService } from './technicians.service';

@ApiTags('Técnicos')
@ApiBearerAuth('access-token')
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar técnicos con disponibilidad derivada' })
  @ApiOkResponse({ type: PaginatedTechniciansResponseDto })
  findAll(
    @Query() query: ListTechniciansQueryDto,
  ): Promise<PaginatedTechniciansResponseDto> {
    return this.techniciansService.findAll(query);
  }
}
