import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { HistoryService } from '../history/history.service';
import { TicketHistoryAction } from '../history/enums/ticket-history-action.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import {
  PaginatedTicketsResponseDto,
  TicketDetailResponseDto,
  TicketHistoryResponseDto,
  TicketSummaryResponseDto,
} from './dto/ticket-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ImpactAssessment } from './entities/impact-assessment.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import { calculateTicketPriority } from './priority/ticket-priority-calculator';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly tickets: Repository<Ticket>,
    private readonly dataSource: DataSource,
    private readonly historyService: HistoryService,
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    const priority = calculateTicketPriority(createTicketDto.impactAssessment);
    const ticketId = await this.dataSource.transaction(async (manager) => {
      const ticketRepository = manager.getRepository(Ticket);
      const savedTicket = await ticketRepository.save(
        ticketRepository.create({
          description: createTicketDto.description,
          location: createTicketDto.location,
          asset: createTicketDto.asset,
          priority,
          status: TicketStatus.NEW,
          requesterId: actor.id,
          currentTechnicianId: null,
          resolvedById: null,
          closedById: null,
          resolvedAt: null,
          closedAt: null,
        }),
      );

      const assessments = manager.getRepository(ImpactAssessment);
      await assessments.save(
        assessments.create({
          ticketId: savedTicket.id,
          ...createTicketDto.impactAssessment,
          calculatedPriority: priority,
        }),
      );

      await this.historyService.record(manager, {
        ticketId: savedTicket.id,
        actorId: actor.id,
        action: TicketHistoryAction.TICKET_CREATED,
        newStatus: TicketStatus.NEW,
        newPriority: priority,
      });

      return savedTicket.id;
    });

    return this.findOne(ticketId, actor);
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const ticket = await manager
        .getRepository(Ticket)
        .createQueryBuilder('ticket')
        .setLock('pessimistic_write')
        .where('ticket.id = :id', { id })
        .andWhere('ticket.requesterId = :requesterId', { requesterId: actor.id })
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      if (ticket.status !== TicketStatus.NEW) {
        throw new ConflictException(
          'Solo se pueden editar tickets en estado NEW',
        );
      }

      ticket.description = updateTicketDto.description;
      await manager.getRepository(Ticket).save(ticket);
      await this.historyService.record(manager, {
        ticketId: ticket.id,
        actorId: actor.id,
        action: TicketHistoryAction.TICKET_UPDATED,
        details: { changedFields: ['description'] },
      });
    });

    return this.findOne(id, actor);
  }

  async findAll(
    query: ListTicketsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponseDto> {
    const ticketQuery = this.tickets
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.requester', 'requester');

    this.applyVisibility(ticketQuery, actor);
    if (query.status) {
      ticketQuery.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.priority) {
      ticketQuery.andWhere('ticket.priority = :priority', {
        priority: query.priority,
      });
    }

    const [tickets, total] = await ticketQuery
      .orderBy('ticket.createdAt', 'DESC')
      .addOrderBy('ticket.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      items: tickets.map((ticket) => this.toSummary(ticket)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    const ticketQuery = this.tickets
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.requester', 'requester')
      .leftJoinAndSelect('ticket.impactAssessment', 'impactAssessment')
      .leftJoinAndSelect('ticket.history', 'history')
      .leftJoinAndSelect('history.actor', 'historyActor')
      .where('ticket.id = :id', { id });

    this.applyVisibility(ticketQuery, actor);
    const ticket = await ticketQuery
      .orderBy('history.createdAt', 'ASC')
      .addOrderBy('history.id', 'ASC')
      .getOne();

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return this.toDetail(ticket);
  }

  private applyVisibility(
    query: SelectQueryBuilder<Ticket>,
    actor: AuthenticatedUser,
  ): void {
    if (actor.role !== UserRole.ADMIN) {
      query.andWhere('ticket.requesterId = :requesterId', {
        requesterId: actor.id,
      });
    }
  }

  private toSummary(ticket: Ticket): TicketSummaryResponseDto {
    return {
      id: ticket.id,
      description: ticket.description,
      location: ticket.location,
      asset: ticket.asset,
      priority: ticket.priority,
      status: ticket.status,
      requester: {
        id: ticket.requester.id,
        name: ticket.requester.name,
      },
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  private toDetail(ticket: Ticket): TicketDetailResponseDto {
    if (!ticket.impactAssessment) {
      throw new NotFoundException('Evaluación de impacto no encontrada');
    }

    return {
      ...this.toSummary(ticket),
      impactAssessment: {
        safetyRisk: ticket.impactAssessment.safetyRisk,
        equipmentStopped: ticket.impactAssessment.equipmentStopped,
        productionImpact: ticket.impactAssessment.productionImpact,
        workaroundAvailable: ticket.impactAssessment.workaroundAvailable,
        affectsOtherAreas: ticket.impactAssessment.affectsOtherAreas,
        calculatedPriority: ticket.impactAssessment.calculatedPriority,
      },
      history: ticket.history.map((entry) => this.toHistoryEntry(entry)),
    };
  }

  private toHistoryEntry(
    entry: Ticket['history'][number],
  ): TicketHistoryResponseDto {
    return {
      id: entry.id,
      actor: { id: entry.actor.id, name: entry.actor.name },
      action: entry.action,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      previousPriority: entry.previousPriority,
      newPriority: entry.newPriority,
      details: entry.details,
      createdAt: entry.createdAt,
    };
  }
}
