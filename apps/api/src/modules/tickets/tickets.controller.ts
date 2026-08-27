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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import {
  PaginatedTicketsResponseDto,
  TicketDetailResponseDto,
} from './dto/ticket-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
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
}
