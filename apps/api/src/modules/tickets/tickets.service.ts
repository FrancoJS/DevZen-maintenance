import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { HistoryService } from '../history/history.service';
import { TicketHistoryAction } from '../history/enums/ticket-history-action.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CurrentMaintenanceResponseDto } from './dto/current-maintenance-response.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import {
  PaginatedTicketsResponseDto,
  AssignmentHistoryResponseDto,
  TicketDetailResponseDto,
  TicketHistoryResponseDto,
  TicketSummaryResponseDto,
} from './dto/ticket-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ImpactAssessment } from './entities/impact-assessment.entity';
import { AssignmentHistory } from './entities/assignment-history.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import { AssignmentReleaseReason } from './enums/assignment-release-reason.enum';
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
        .andWhere('ticket.requesterId = :requesterId', {
          requesterId: actor.id,
        })
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

  async assign(
    id: string,
    assignTechnicianDto: AssignTechnicianDto,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo un administrador puede asignar técnicos',
      );
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const ticket = await manager
          .getRepository(Ticket)
          .createQueryBuilder('ticket')
          .setLock('pessimistic_write')
          .where('ticket.id = :id', { id })
          .getOne();

        if (!ticket) {
          throw new NotFoundException('Ticket no encontrado');
        }
        if (ticket.status !== TicketStatus.NEW) {
          throw new ConflictException(
            'Solo se pueden asignar tickets en estado NEW',
          );
        }

        const technician = await manager.getRepository(User).findOne({
          where: { id: assignTechnicianDto.technicianId },
        });
        if (!technician) {
          throw new NotFoundException('Técnico no encontrado');
        }
        if (technician.role !== UserRole.TECHNICIAN) {
          throw new BadRequestException(
            'El usuario seleccionado no es un técnico',
          );
        }

        const assignments = manager.getRepository(AssignmentHistory);
        const activeAssignment = await assignments.findOne({
          where: {
            technicianId: technician.id,
            releasedAt: IsNull(),
          },
        });
        if (activeAssignment) {
          throw new ConflictException('El técnico seleccionado está ocupado');
        }

        await assignments.save(
          assignments.create({
            ticketId: ticket.id,
            technicianId: technician.id,
            assignedById: actor.id,
            startedAt: null,
            releasedAt: null,
            releaseReason: null,
          }),
        );

        ticket.status = TicketStatus.ASSIGNED;
        ticket.currentTechnicianId = technician.id;
        await manager.getRepository(Ticket).save(ticket);
        await this.historyService.record(manager, {
          ticketId: ticket.id,
          actorId: actor.id,
          action: TicketHistoryAction.TECHNICIAN_ASSIGNED,
          previousStatus: TicketStatus.NEW,
          newStatus: TicketStatus.ASSIGNED,
          details: { technicianId: technician.id },
        });
      });
    } catch (error) {
      if (this.isActiveAssignmentUniqueViolation(error)) {
        throw new ConflictException('El técnico seleccionado está ocupado');
      }
      throw error;
    }

    return this.findOne(id, actor);
  }

  async findCurrentMaintenance(
    actor: AuthenticatedUser,
  ): Promise<CurrentMaintenanceResponseDto> {
    if (actor.role !== UserRole.TECHNICIAN) {
      throw new ForbiddenException(
        'Solo un técnico puede consultar su mantención',
      );
    }

    const ticket = await this.tickets.findOne({
      where: { currentTechnicianId: actor.id },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });

    return { ticket: ticket ? await this.findOne(ticket.id, actor) : null };
  }

  async start(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    this.assertTechnician(actor);

    await this.dataSource.transaction(async (manager) => {
      const ticket = await manager
        .getRepository(Ticket)
        .createQueryBuilder('ticket')
        .setLock('pessimistic_write')
        .where('ticket.id = :id', { id })
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      this.assertCurrentTechnician(ticket, actor);
      if (ticket.status !== TicketStatus.ASSIGNED) {
        throw new ConflictException(
          'Solo se pueden iniciar tickets en estado ASSIGNED',
        );
      }

      const assignments = manager.getRepository(AssignmentHistory);
      const assignment = await assignments
        .createQueryBuilder('assignment')
        .setLock('pessimistic_write')
        .where('assignment.ticketId = :ticketId', { ticketId: ticket.id })
        .andWhere('assignment.releasedAt IS NULL')
        .getOne();
      if (!assignment || assignment.technicianId !== actor.id) {
        throw new ConflictException('No existe una asignación activa válida');
      }
      if (assignment.startedAt) {
        throw new ConflictException('La mantención ya fue iniciada');
      }

      const maintenances = manager.getRepository(Maintenance);
      const existingMaintenance = await maintenances.findOne({
        where: { ticketId: ticket.id },
      });
      if (!existingMaintenance) {
        await maintenances.save(
          maintenances.create({
            ticketId: ticket.id,
            diagnosis: null,
            workPerformed: null,
            notes: null,
            finalEvidenceUrl: null,
          }),
        );
      }

      assignment.startedAt = new Date();
      await assignments.save(assignment);
      ticket.status = TicketStatus.IN_PROGRESS;
      await manager.getRepository(Ticket).save(ticket);
      await this.historyService.record(manager, {
        ticketId: ticket.id,
        actorId: actor.id,
        action: TicketHistoryAction.MAINTENANCE_STARTED,
        previousStatus: TicketStatus.ASSIGNED,
        newStatus: TicketStatus.IN_PROGRESS,
      });
    });

    return this.findOne(id, actor);
  }

  async updateMaintenance(
    id: string,
    updateMaintenanceDto: UpdateMaintenanceDto,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    this.assertTechnician(actor);
    const fields = this.maintenanceFieldsProvided(updateMaintenanceDto);
    if (fields.length === 0) {
      throw new BadRequestException(
        'Se debe proporcionar al menos un campo de mantención',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const ticket = await manager
        .getRepository(Ticket)
        .createQueryBuilder('ticket')
        .setLock('pessimistic_write')
        .where('ticket.id = :id', { id })
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      this.assertCurrentTechnician(ticket, actor);
      if (ticket.status !== TicketStatus.IN_PROGRESS) {
        throw new ConflictException(
          'Solo se puede registrar información en estado IN_PROGRESS',
        );
      }

      const maintenances = manager.getRepository(Maintenance);
      const maintenance = await maintenances.findOne({
        where: { ticketId: ticket.id },
      });
      if (!maintenance) {
        throw new ConflictException('Información de mantención no encontrada');
      }

      const changes: Record<
        string,
        { previous: string | null; newValue: string | null }
      > = {};
      for (const field of fields) {
        const nextValue = updateMaintenanceDto[field] ?? null;
        if (maintenance[field] !== nextValue) {
          changes[field] = {
            previous: maintenance[field],
            newValue: nextValue,
          };
          maintenance[field] = nextValue;
        }
      }

      if (Object.keys(changes).length > 0) {
        await maintenances.save(maintenance);
        await this.historyService.record(manager, {
          ticketId: ticket.id,
          actorId: actor.id,
          action: TicketHistoryAction.MAINTENANCE_UPDATED,
          details: { changes },
        });
      }
    });

    return this.findOne(id, actor);
  }

  async resolve(
    id: string,
    resolveTicketDto: ResolveTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketDetailResponseDto> {
    this.assertTechnician(actor);

    await this.dataSource.transaction(async (manager) => {
      const ticket = await manager
        .getRepository(Ticket)
        .createQueryBuilder('ticket')
        .setLock('pessimistic_write')
        .where('ticket.id = :id', { id })
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      this.assertCurrentTechnician(ticket, actor);
      if (ticket.status !== TicketStatus.IN_PROGRESS) {
        throw new ConflictException(
          'Solo se pueden resolver tickets en estado IN_PROGRESS',
        );
      }

      const assignments = manager.getRepository(AssignmentHistory);
      const assignment = await assignments
        .createQueryBuilder('assignment')
        .setLock('pessimistic_write')
        .where('assignment.ticketId = :ticketId', { ticketId: ticket.id })
        .andWhere('assignment.releasedAt IS NULL')
        .getOne();
      if (!assignment || assignment.technicianId !== actor.id) {
        throw new ConflictException('No existe una asignación activa válida');
      }

      const maintenances = manager.getRepository(Maintenance);
      const maintenance = await maintenances.findOne({
        where: { ticketId: ticket.id },
      });
      if (!maintenance) {
        throw new ConflictException('Información de mantención no encontrada');
      }

      const resolvedAt = new Date();
      maintenance.workPerformed = resolveTicketDto.workPerformed;
      assignment.releasedAt = resolvedAt;
      assignment.releaseReason = AssignmentReleaseReason.RESOLVED;
      ticket.status = TicketStatus.RESOLVED;
      ticket.currentTechnicianId = null;
      ticket.resolvedById = actor.id;
      ticket.resolvedAt = resolvedAt;

      await maintenances.save(maintenance);
      await assignments.save(assignment);
      await manager.getRepository(Ticket).save(ticket);
      await this.historyService.record(manager, {
        ticketId: ticket.id,
        actorId: actor.id,
        action: TicketHistoryAction.TICKET_RESOLVED,
        previousStatus: TicketStatus.IN_PROGRESS,
        newStatus: TicketStatus.RESOLVED,
        details: { workPerformedRecorded: true },
      });
    });

    return this.findOne(id, actor);
  }

  async findMaintenanceHistory(
    query: ListTicketsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponseDto> {
    this.assertTechnician(actor);

    const ticketQuery = this.tickets
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.requester', 'requester')
      .where(
        `EXISTS (
          SELECT 1
          FROM assignment_histories assignment_history
          WHERE assignment_history.ticket_id = ticket.id
            AND assignment_history.technician_id = :technicianId
            AND assignment_history.released_at IS NOT NULL
        )`,
        { technicianId: actor.id },
      );

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
      .leftJoinAndSelect('ticket.currentTechnician', 'currentTechnician')
      .leftJoinAndSelect('ticket.resolvedBy', 'resolvedBy')
      .leftJoinAndSelect('ticket.impactAssessment', 'impactAssessment')
      .leftJoinAndSelect('ticket.maintenance', 'maintenance')
      .leftJoinAndSelect('ticket.history', 'history')
      .leftJoinAndSelect('history.actor', 'historyActor')
      .where('ticket.id = :id', { id });

    this.applyVisibility(ticketQuery, actor, true);
    const ticket = await ticketQuery
      .orderBy('history.createdAt', 'ASC')
      .addOrderBy('history.id', 'ASC')
      .getOne();

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const assignments = await this.findAssignments(ticket.id);
    return this.toDetail(ticket, assignments);
  }

  private applyVisibility(
    query: SelectQueryBuilder<Ticket>,
    actor: AuthenticatedUser,
    includeCurrentMaintenance = false,
  ): void {
    if (actor.role === UserRole.TECHNICIAN && includeCurrentMaintenance) {
      query.andWhere(
        `(ticket.requesterId = :requesterId
          OR ticket.currentTechnicianId = :currentTechnicianId
          OR EXISTS (
            SELECT 1
            FROM assignment_histories assignment_history
            WHERE assignment_history.ticket_id = ticket.id
              AND assignment_history.technician_id = :technicianId
              AND assignment_history.released_at IS NOT NULL
          ))`,
        {
          requesterId: actor.id,
          currentTechnicianId: actor.id,
          technicianId: actor.id,
        },
      );
      return;
    }

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

  private toDetail(
    ticket: Ticket,
    assignments: AssignmentHistory[],
  ): TicketDetailResponseDto {
    if (!ticket.impactAssessment) {
      throw new NotFoundException('Evaluación de impacto no encontrada');
    }

    return {
      ...this.toSummary(ticket),
      currentTechnician: ticket.currentTechnician
        ? {
            id: ticket.currentTechnician.id,
            name: ticket.currentTechnician.name,
          }
        : null,
      resolvedBy: ticket.resolvedBy
        ? {
            id: ticket.resolvedBy.id,
            name: ticket.resolvedBy.name,
          }
        : null,
      resolvedAt: ticket.resolvedAt,
      impactAssessment: {
        safetyRisk: ticket.impactAssessment.safetyRisk,
        equipmentStopped: ticket.impactAssessment.equipmentStopped,
        productionImpact: ticket.impactAssessment.productionImpact,
        workaroundAvailable: ticket.impactAssessment.workaroundAvailable,
        affectsOtherAreas: ticket.impactAssessment.affectsOtherAreas,
        calculatedPriority: ticket.impactAssessment.calculatedPriority,
      },
      assignments: assignments.map((assignment) =>
        this.toAssignmentHistory(assignment),
      ),
      maintenance: ticket.maintenance
        ? {
            diagnosis: ticket.maintenance.diagnosis,
            workPerformed: ticket.maintenance.workPerformed,
            notes: ticket.maintenance.notes,
          }
        : null,
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

  private findAssignments(ticketId: string): Promise<AssignmentHistory[]> {
    return this.tickets.manager.getRepository(AssignmentHistory).find({
      where: { ticketId },
      relations: { technician: true, assignedBy: true },
      order: { assignedAt: 'ASC', id: 'ASC' },
    });
  }

  private toAssignmentHistory(
    assignment: AssignmentHistory,
  ): AssignmentHistoryResponseDto {
    return {
      id: assignment.id,
      technician: {
        id: assignment.technician.id,
        name: assignment.technician.name,
      },
      assignedBy: {
        id: assignment.assignedBy.id,
        name: assignment.assignedBy.name,
      },
      assignedAt: assignment.assignedAt,
      startedAt: assignment.startedAt,
      releasedAt: assignment.releasedAt,
      releaseReason: assignment.releaseReason,
    };
  }

  private isActiveAssignmentUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const databaseError = error as { code?: unknown; constraint?: unknown };
    return (
      databaseError.code === '23505' &&
      (databaseError.constraint === 'uq_assignment_histories_active_ticket' ||
        databaseError.constraint ===
          'uq_assignment_histories_active_technician')
    );
  }

  private assertTechnician(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.TECHNICIAN) {
      throw new ForbiddenException(
        'Solo un técnico puede realizar acciones de mantención',
      );
    }
  }

  private assertCurrentTechnician(
    ticket: Ticket,
    actor: AuthenticatedUser,
  ): void {
    if (ticket.currentTechnicianId !== actor.id) {
      throw new ForbiddenException('El técnico no está asignado a este ticket');
    }
  }

  private maintenanceFieldsProvided(
    updateMaintenanceDto: UpdateMaintenanceDto,
  ): Array<'diagnosis' | 'workPerformed' | 'notes'> {
    const fields = ['diagnosis', 'workPerformed', 'notes'] as const;
    return fields.filter((field) =>
      Object.prototype.hasOwnProperty.call(updateMaintenanceDto, field),
    );
  }
}
