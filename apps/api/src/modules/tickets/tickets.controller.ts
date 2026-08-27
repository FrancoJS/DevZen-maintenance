import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CurrentMaintenanceResponseDto } from './dto/current-maintenance-response.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import {
  PaginatedTicketsResponseDto,
  TicketDetailResponseDto,
} from './dto/ticket-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un ticket de mantenimiento' })
  @ApiCreatedResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Datos del ticket inválidos.' })
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.create(createTicketDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets visibles para el usuario' })
  @ApiOkResponse({ type: PaginatedTicketsResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros o paginación inválidos.' })
  findAll(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findAll(query, currentUser);
  }

  @Get('my-maintenance')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener la mantención actual del técnico' })
  @ApiOkResponse({ type: CurrentMaintenanceResponseDto })
  currentMaintenance(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<CurrentMaintenanceResponseDto> {
    return this.ticketsService.findCurrentMaintenance(currentUser);
  }

  @Get('my-maintenance-history')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Listar mantenciones anteriores del técnico' })
  @ApiOkResponse({ type: PaginatedTicketsResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros o paginación inválidos.' })
  maintenanceHistory(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findMaintenanceHistory(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un ticket visible' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Identificador de ticket inválido.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar la descripción de un ticket NEW propio' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Datos o identificador inválidos.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  @ApiConflictResponse({ description: 'El ticket no está en estado NEW.' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.update(id, updateTicketDto, currentUser);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar un técnico disponible a un ticket NEW' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Técnico o identificador inválido.' })
  @ApiConflictResponse({
    description: 'El ticket no está disponible o el técnico está ocupado.',
  })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  @ApiNotFoundResponse({ description: 'Ticket o técnico no encontrado.' })
  assign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() assignTechnicianDto: AssignTechnicianDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.assign(id, assignTechnicianDto, currentUser);
  }

  @Post(':id/start')
  @Roles(UserRole.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar una mantención asignada' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiConflictResponse({ description: 'El ticket no está ASSIGNED.' })
  @ApiForbiddenResponse({ description: 'El técnico no es el asignado.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  start(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.start(id, currentUser);
  }

  @Patch(':id/maintenance')
  @Roles(UserRole.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar información técnica de una mantención' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({
    description: 'No se proporcionaron campos técnicos.',
  })
  @ApiConflictResponse({ description: 'El ticket no está IN_PROGRESS.' })
  @ApiForbiddenResponse({ description: 'El técnico no es el asignado.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  updateMaintenance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.updateMaintenance(
      id,
      updateMaintenanceDto,
      currentUser,
    );
  }

  @Post(':id/resolve')
  @Roles(UserRole.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver una mantención en progreso' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({
    description: 'Trabajo realizado o identificador inválido.',
  })
  @ApiConflictResponse({ description: 'El ticket no está IN_PROGRESS.' })
  @ApiForbiddenResponse({ description: 'El técnico no es el asignado.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  resolve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() resolveTicketDto: ResolveTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.resolve(id, resolveTicketDto, currentUser);
  }
}
