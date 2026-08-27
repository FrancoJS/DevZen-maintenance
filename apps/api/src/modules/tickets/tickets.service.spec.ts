import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { HistoryService } from '../history/history.service';
import { UserRole } from '../users/enums/user-role.enum';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { AssignmentHistory } from './entities/assignment-history.entity';
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

  it.each([UserRole.REQUESTER, UserRole.TECHNICIAN])(
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

  it('does not filter the administrator list by requester', async () => {
    const query = createQueryBuilder();
    query.getManyAndCount.mockResolvedValue([[], 0]);
    ticketsRepository.createQueryBuilder.mockReturnValue(query);

    await service.findAll(new ListTicketsQueryDto(), actor(UserRole.ADMIN));

    expect(query.andWhere).not.toHaveBeenCalledWith(
      'ticket.requesterId = :requesterId',
      expect.anything(),
    );
  });

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
});
