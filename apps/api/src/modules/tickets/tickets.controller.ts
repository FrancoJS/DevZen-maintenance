import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedEvidenceFile } from './evidence.service';
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
import { ApproveFreezeRequestDto } from './dto/approve-freeze-request.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CurrentMaintenanceResponseDto } from './dto/current-maintenance-response.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { RejectFreezeRequestDto } from './dto/reject-freeze-request.dto';
import { RequestFreezeDto } from './dto/request-freeze.dto';
import {
  GlobalTicketHistoryResponseDto,
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

  @Post(':id/final-evidence') @Roles(UserRole.TECHNICIAN) @UseInterceptors(FileInterceptor('file', { limits: { fileSize: Number(process.env.FINAL_EVIDENCE_MAX_BYTES ?? 5242880) } }))
  uploadFinalEvidence(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @UploadedFile() file: UploadedEvidenceFile, @CurrentUser() currentUser: AuthenticatedUser): Promise<TicketDetailResponseDto> { if (!file) throw new BadRequestException('Se requiere un archivo'); return this.ticketsService.uploadFinalEvidence(id, file, currentUser); }

  @Get()
  @ApiOperation({
    summary: 'Listar las solicitudes creadas por el usuario autenticado',
  })
  @ApiOkResponse({ type: PaginatedTicketsResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros o paginación inválidos.' })
  findAll(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findAll(query, currentUser);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los tickets para administración' })
  @ApiOkResponse({ type: PaginatedTicketsResponseDto })
  findAllAdmin(@Query() query: ListTicketsQueryDto, @CurrentUser() currentUser: AuthenticatedUser): Promise<PaginatedTicketsResponseDto> {
    return this.ticketsService.findAllAdmin(query, currentUser);
  }

  @Get('admin/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar historial global de tickets cerrados' })
  @ApiOkResponse({ type: GlobalTicketHistoryResponseDto })
  globalClosedHistory(@CurrentUser() currentUser: AuthenticatedUser): Promise<GlobalTicketHistoryResponseDto> {
    return this.ticketsService.findGlobalClosedHistory(currentUser);
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

  @Post(':id/freeze-requests')
  @Roles(UserRole.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar el congelamiento de una mantención' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Motivo o identificador inválido.' })
  @ApiConflictResponse({
    description: 'El ticket no permite solicitar congelamiento.',
  })
  @ApiForbiddenResponse({ description: 'El técnico no es el asignado.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  requestFreeze(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() requestFreezeDto: RequestFreezeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.requestFreeze(id, requestFreezeDto, currentUser);
  }

  @Post(':id/freeze-requests/:freezeRequestId/approve')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar una solicitud de congelamiento' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiConflictResponse({ description: 'La solicitud no está pendiente.' })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  @ApiNotFoundResponse({ description: 'Ticket o solicitud no encontrados.' })
  approveFreeze(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('freezeRequestId', new ParseUUIDPipe({ version: '4' }))
    freezeRequestId: string,
    @Body() approveFreezeRequestDto: ApproveFreezeRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.approveFreeze(
      id,
      freezeRequestId,
      approveFreezeRequestDto,
      currentUser,
    );
  }

  @Post(':id/freeze-requests/:freezeRequestId/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una solicitud de congelamiento' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Motivo o identificador inválido.' })
  @ApiConflictResponse({ description: 'La solicitud no está pendiente.' })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  @ApiNotFoundResponse({ description: 'Ticket o solicitud no encontrados.' })
  rejectFreeze(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('freezeRequestId', new ParseUUIDPipe({ version: '4' }))
    freezeRequestId: string,
    @Body() rejectFreezeRequestDto: RejectFreezeRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.rejectFreeze(
      id,
      freezeRequestId,
      rejectFreezeRequestDto,
      currentUser,
    );
  }

  @Post(':id/resolve-blocker')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar como resuelto el bloqueo de un ticket congelado',
  })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiConflictResponse({ description: 'El ticket no está FROZEN.' })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  resolveBlocker(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.resolveBlocker(id, currentUser);
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

  @Post(':id/close')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar administrativamente un ticket resuelto' })
  @ApiOkResponse({ type: TicketDetailResponseDto })
  @ApiBadRequestResponse({
    description: 'Observación o identificador inválido.',
  })
  @ApiConflictResponse({ description: 'El ticket no está RESOLVED.' })
  @ApiForbiddenResponse({ description: 'Acción exclusiva de administración.' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado.' })
  close(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() closeTicketDto: CloseTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    return this.ticketsService.close(id, closeTicketDto, currentUser);
  }
}
