import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { HistoryService } from '../history/history.service';
import { UserRole } from '../users/enums/user-role.enum';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignmentReleaseReason } from './enums/assignment-release-reason.enum';
import { TicketStatus } from './enums/ticket-status.enum';
import { AssignmentHistory } from './entities/assignment-history.entity';
import { FreezeRequest } from './entities/freeze-request.entity';
import { Maintenance } from './entities/maintenance.entity';
import { FreezeRequestStatus } from './enums/freeze-request-status.enum';
import { Ticket } from './entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { TicketsService } from './tickets.service';

function createQueryBuilder(getOne: jest.Mock = jest.fn()) {
  const builder = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    setLock: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getOne,
    getManyAndCount: jest.fn(),
  };
  for (const method of [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'setLock',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
  ] as const) {
    builder[method].mockReturnValue(builder);
  }
  return builder;
}

const actor = (role: UserRole, id = 'actor-id'): AuthenticatedUser => ({
  id,
  role,
});

describe('TicketsService', () => {
  const ticketsRepository = { createQueryBuilder: jest.fn() };
  const dataSource = { transaction: jest.fn() } as unknown as DataSource;
  const historyService = { record: jest.fn() } as unknown as HistoryService;
  const service = new TicketsService(
    ticketsRepository as never,
    dataSource,
    historyService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does not allow a user to edit a ticket they do not own', async () => {
    const query = createQueryBuilder();
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => query),
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.update(
        'ticket-id',
        { description: 'Nueva descripción' } as UpdateTicketDto,
        actor(UserRole.REQUESTER),
      ),
    ).rejects.toEqual(new NotFoundException('Ticket no encontrado'));
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('does not allow the owner to edit a ticket outside NEW', async () => {
    const query = createQueryBuilder(
      jest
        .fn()
        .mockResolvedValue({ id: 'ticket-id', status: TicketStatus.ASSIGNED }),
    );
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => query),
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.update(
        'ticket-id',
        { description: 'Nueva descripción' } as UpdateTicketDto,
        actor(UserRole.REQUESTER),
      ),
    ).rejects.toEqual(
      new ConflictException('Solo se pueden editar tickets en estado NEW'),
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it.each([UserRole.REQUESTER, UserRole.TECHNICIAN, UserRole.ADMIN])(
    'filters the list by requester for %s',
    async (role) => {
      const query = createQueryBuilder();
      query.getManyAndCount.mockResolvedValue([[], 0]);
      ticketsRepository.createQueryBuilder.mockReturnValue(query);

      await service.findAll(new ListTicketsQueryDto(), actor(role));

      expect(query.andWhere).toHaveBeenCalledWith(
        'ticket.requesterId = :requesterId',
        { requesterId: 'actor-id' },
      );
    },
  );

  it('does not reveal a ticket that is outside the actor visibility scope', async () => {
    const query = createQueryBuilder();
    ticketsRepository.createQueryBuilder.mockReturnValue(query);

    await expect(
      service.findOne('ticket-id', actor(UserRole.REQUESTER)),
    ).rejects.toEqual(new NotFoundException('Ticket no encontrado'));
    expect(query.andWhere).toHaveBeenCalledWith(
      'ticket.requesterId = :requesterId',
      { requesterId: 'actor-id' },
    );
  });

  it('does not allow a non-administrator to assign a technician', async () => {
    await expect(
      service.assign(
        'ticket-id',
        { technicianId: 'technician-id' },
        actor(UserRole.TECHNICIAN),
      ),
    ).rejects.toEqual(
      new ForbiddenException('Solo un administrador puede asignar técnicos'),
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects an assignment when the technician already has an active assignment', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.NEW,
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const assignments = {
      findOne: jest.fn().mockResolvedValue({ id: 'active-assignment' }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return { createQueryBuilder: jest.fn(() => ticketQuery) };
        }
        if (entity === User) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'technician-id',
              role: UserRole.TECHNICIAN,
            }),
          };
        }
        if (entity === AssignmentHistory) {
          return assignments;
        }
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.assign(
        'ticket-id',
        { technicianId: 'technician-id' },
        actor(UserRole.ADMIN),
      ),
    ).rejects.toEqual(
      new ConflictException('El técnico seleccionado está ocupado'),
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('maps the active-technician database constraint to a conflict', async () => {
    (dataSource.transaction as jest.Mock).mockRejectedValue({
      code: '23505',
      constraint: 'uq_assignment_histories_active_technician',
    });

    await expect(
      service.assign(
        'ticket-id',
        { technicianId: 'technician-id' },
        actor(UserRole.ADMIN),
      ),
    ).rejects.toEqual(
      new ConflictException('El técnico seleccionado está ocupado'),
    );
  });

  it('creates the assignment, state transition, and audit event atomically', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.NEW,
      currentTechnicianId: null,
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const saveTicket = jest.fn();
    const assignments = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return {
            createQueryBuilder: jest.fn(() => ticketQuery),
            save: saveTicket,
          };
        }
        if (entity === User) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'technician-id',
              role: UserRole.TECHNICIAN,
            }),
          };
        }
        if (entity === AssignmentHistory) {
          return assignments;
        }
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.assign(
      'ticket-id',
      { technicianId: 'technician-id' },
      actor(UserRole.ADMIN),
    );

    expect(assignments.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: 'ticket-id',
        technicianId: 'technician-id',
        assignedById: 'actor-id',
      }),
    );
    expect(ticket).toMatchObject({
      status: TicketStatus.ASSIGNED,
      currentTechnicianId: 'technician-id',
    });
    expect(saveTicket).toHaveBeenCalledWith(ticket);
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        action: 'TECHNICIAN_ASSIGNED',
        previousStatus: TicketStatus.NEW,
        newStatus: TicketStatus.ASSIGNED,
      }),
    );
  });

  it('starts an assigned maintenance with the active assignment and history', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.ASSIGNED,
      currentTechnicianId: 'actor-id',
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const assignment = {
      technicianId: 'actor-id',
      startedAt: null,
    } as AssignmentHistory;
    const assignmentQuery = createQueryBuilder(
      jest.fn().mockResolvedValue(assignment),
    );
    const saveTicket = jest.fn();
    const assignments = {
      createQueryBuilder: jest.fn(() => assignmentQuery),
      save: jest.fn(),
    };
    const maintenances = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return {
            createQueryBuilder: jest.fn(() => ticketQuery),
            save: saveTicket,
          };
        }
        if (entity === AssignmentHistory) {
          return assignments;
        }
        if (entity === Maintenance) {
          return maintenances;
        }
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.start('ticket-id', actor(UserRole.TECHNICIAN));

    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    expect(assignment.startedAt).toBeInstanceOf(Date);
    expect(maintenances.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: 'ticket-id',
        diagnosis: null,
        workPerformed: null,
        notes: null,
      }),
    );
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        action: 'MAINTENANCE_STARTED',
        previousStatus: TicketStatus.ASSIGNED,
        newStatus: TicketStatus.IN_PROGRESS,
      }),
    );
  });

  it('does not allow another technician to start an assigned ticket', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.ASSIGNED,
      currentTechnicianId: 'other-technician-id',
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ticketQuery),
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.start('ticket-id', actor(UserRole.TECHNICIAN)),
    ).rejects.toEqual(
      new ForbiddenException('El técnico no está asignado a este ticket'),
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('rejects an empty technical update before opening a transaction', async () => {
    await expect(
      service.updateMaintenance(
        'ticket-id',
        {} as UpdateMaintenanceDto,
        actor(UserRole.TECHNICIAN),
      ),
    ).rejects.toEqual(
      new BadRequestException(
        'Se debe proporcionar al menos un campo de mantención',
      ),
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('updates only submitted technical fields and records their before and after values', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.IN_PROGRESS,
      currentTechnicianId: 'actor-id',
    } as Ticket;
    const maintenance = {
      ticketId: 'ticket-id',
      diagnosis: 'Diagnóstico inicial',
      workPerformed: null,
      notes: 'Nota inicial',
    } as Maintenance;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const maintenances = {
      findOne: jest.fn().mockResolvedValue(maintenance),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return { createQueryBuilder: jest.fn(() => ticketQuery) };
        }
        if (entity === Maintenance) {
          return maintenances;
        }
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.updateMaintenance(
      'ticket-id',
      {
        diagnosis: 'Diagnóstico confirmado',
        notes: null,
      },
      actor(UserRole.TECHNICIAN),
    );

    expect(maintenance).toMatchObject({
      diagnosis: 'Diagnóstico confirmado',
      workPerformed: null,
      notes: null,
    });
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        action: 'MAINTENANCE_UPDATED',
        details: {
          changes: {
            diagnosis: {
              previous: 'Diagnóstico inicial',
              newValue: 'Diagnóstico confirmado',
            },
            notes: { previous: 'Nota inicial', newValue: null },
          },
        },
      }),
    );
  });

  it('resolves a maintenance, releases the technician, and records the transition atomically', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.IN_PROGRESS,
      currentTechnicianId: 'actor-id',
      resolvedById: null,
      resolvedAt: null,
    } as Ticket;
    const assignment = {
      ticketId: 'ticket-id',
      technicianId: 'actor-id',
      releasedAt: null,
      releaseReason: null,
    } as AssignmentHistory;
    const maintenance = {
      ticketId: 'ticket-id',
      workPerformed: 'Trabajo preliminar',
    } as Maintenance;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const assignmentQuery = createQueryBuilder(
      jest.fn().mockResolvedValue(assignment),
    );
    const saveTicket = jest.fn();
    const assignments = {
      createQueryBuilder: jest.fn(() => assignmentQuery),
      save: jest.fn(),
    };
    const maintenances = {
      findOne: jest.fn().mockResolvedValue(maintenance),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return {
            createQueryBuilder: jest.fn(() => ticketQuery),
            save: saveTicket,
          };
        }
        if (entity === AssignmentHistory) {
          return assignments;
        }
        if (entity === Maintenance) {
          return maintenances;
        }
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.resolve(
      'ticket-id',
      { workPerformed: 'Trabajo final realizado' } as ResolveTicketDto,
      actor(UserRole.TECHNICIAN),
    );

    expect(maintenance.workPerformed).toBe('Trabajo final realizado');
    expect(assignment).toMatchObject({
      releaseReason: AssignmentReleaseReason.RESOLVED,
      releasedAt: expect.any(Date),
    });
    expect(ticket).toMatchObject({
      status: TicketStatus.RESOLVED,
      currentTechnicianId: null,
      resolvedById: 'actor-id',
      resolvedAt: expect.any(Date),
    });
    expect(maintenances.save).toHaveBeenCalledWith(maintenance);
    expect(assignments.save).toHaveBeenCalledWith(assignment);
    expect(saveTicket).toHaveBeenCalledWith(ticket);
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        action: 'TICKET_RESOLVED',
        previousStatus: TicketStatus.IN_PROGRESS,
        newStatus: TicketStatus.RESOLVED,
      }),
    );
  });

  it('does not allow another technician to resolve a maintenance', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.IN_PROGRESS,
      currentTechnicianId: 'other-technician-id',
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ticketQuery),
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.resolve(
        'ticket-id',
        { workPerformed: 'Trabajo final realizado' } as ResolveTicketDto,
        actor(UserRole.TECHNICIAN),
      ),
    ).rejects.toEqual(
      new ForbiddenException('El técnico no está asignado a este ticket'),
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('creates a pending freeze request without releasing the assigned technician', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.IN_PROGRESS,
      currentTechnicianId: 'actor-id',
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const assignmentQuery = createQueryBuilder(
      jest.fn().mockResolvedValue({ technicianId: 'actor-id' }),
    );
    const freezes = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) {
          return {
            createQueryBuilder: jest.fn(() => ticketQuery),
            save: jest.fn(),
          };
        }
        if (entity === AssignmentHistory) {
          return { createQueryBuilder: jest.fn(() => assignmentQuery) };
        }
        if (entity === FreezeRequest) return freezes;
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.requestFreeze(
      'ticket-id',
      { reasonType: 'OTHER', reasonDetail: 'Esperando proveedor' } as never,
      actor(UserRole.TECHNICIAN),
    );

    expect(ticket.status).toBe(TicketStatus.FREEZE_REQUESTED);
    expect(freezes.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: FreezeRequestStatus.PENDING }),
    );
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ action: 'FREEZE_REQUESTED' }),
    );
  });

  it('approves a freeze request atomically and releases its active assignment', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.FREEZE_REQUESTED,
      currentTechnicianId: 'technician-id',
    } as Ticket;
    const assignment = {
      id: 'assignment-id',
      technicianId: 'technician-id',
      releasedAt: null,
      releaseReason: null,
    } as AssignmentHistory;
    const freeze = {
      id: 'freeze-id',
      status: FreezeRequestStatus.PENDING,
      reviewedById: null,
      reviewedAt: null,
      reviewNote: null,
    } as FreezeRequest;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const assignmentQuery = createQueryBuilder(
      jest.fn().mockResolvedValue(assignment),
    );
    const freezeQuery = createQueryBuilder(jest.fn().mockResolvedValue(freeze));
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket)
          return {
            createQueryBuilder: jest.fn(() => ticketQuery),
            save: jest.fn(),
          };
        if (entity === AssignmentHistory)
          return {
            createQueryBuilder: jest.fn(() => assignmentQuery),
            save: jest.fn(),
          };
        if (entity === FreezeRequest)
          return {
            createQueryBuilder: jest.fn(() => freezeQuery),
            save: jest.fn(),
          };
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.approveFreeze(
      'ticket-id',
      'freeze-id',
      {},
      actor(UserRole.ADMIN),
    );

    expect(ticket).toMatchObject({
      status: TicketStatus.FROZEN,
      currentTechnicianId: null,
    });
    expect(assignment).toMatchObject({
      releaseReason: AssignmentReleaseReason.FREEZE_APPROVED,
      releasedAt: expect.any(Date),
    });
    expect(freeze).toMatchObject({
      status: FreezeRequestStatus.APPROVED,
      reviewedById: 'actor-id',
    });
  });

  it('lists only maintenance tickets released from the current technician', async () => {
    const query = createQueryBuilder();
    query.getManyAndCount.mockResolvedValue([[], 0]);
    ticketsRepository.createQueryBuilder.mockReturnValue(query);

    await service.findMaintenanceHistory(
      new ListTicketsQueryDto(),
      actor(UserRole.TECHNICIAN),
    );

    expect(query.where).toHaveBeenCalledWith(
      expect.stringContaining('assignment_history.released_at IS NOT NULL'),
      { technicianId: 'actor-id' },
    );
  });

  it('closes a resolved ticket and records the optional administrative note atomically', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.RESOLVED,
      closedById: null,
      closedAt: null,
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const saveTicket = jest.fn();
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ticketQuery),
        save: saveTicket,
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.close(
      'ticket-id',
      { note: 'Cierre administrativo confirmado' } as CloseTicketDto,
      actor(UserRole.ADMIN),
    );

    expect(ticket).toMatchObject({
      status: TicketStatus.CLOSED,
      closedById: 'actor-id',
      closedAt: expect.any(Date),
    });
    expect(saveTicket).toHaveBeenCalledWith(ticket);
    expect(historyService.record).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        action: 'TICKET_CLOSED',
        previousStatus: TicketStatus.RESOLVED,
        newStatus: TicketStatus.CLOSED,
        details: { note: 'Cierre administrativo confirmado' },
      }),
    );
  });

  it('rejects closing a ticket outside RESOLVED without recording history', async () => {
    const ticket = {
      id: 'ticket-id',
      status: TicketStatus.CLOSED,
    } as Ticket;
    const ticketQuery = createQueryBuilder(jest.fn().mockResolvedValue(ticket));
    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ticketQuery),
      })),
    };
    (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
      callback(manager),
    );

    await expect(
      service.close('ticket-id', {} as CloseTicketDto, actor(UserRole.ADMIN)),
    ).rejects.toEqual(
      new ConflictException('Solo se pueden cerrar tickets en estado RESOLVED'),
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('does not allow a non-administrator to close a ticket', async () => {
    await expect(
      service.close(
        'ticket-id',
        {} as CloseTicketDto,
        actor(UserRole.TECHNICIAN),
      ),
    ).rejects.toEqual(
      new ForbiddenException('Solo un administrador puede cerrar tickets'),
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
