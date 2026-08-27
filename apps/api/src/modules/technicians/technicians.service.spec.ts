import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketPriority } from '../tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { TechnicianAvailability } from './dto/technician-response.dto';
import { TechniciansService } from './technicians.service';

function technician(currentTickets: Ticket[]): User {
  return Object.assign(new User(), {
    id: 'technician-id',
    name: 'Camila Soto',
    email: 'tecnico@luxnova.demo',
    role: UserRole.TECHNICIAN,
    currentTickets,
  });
}

function activeTicket(): Ticket {
  return Object.assign(new Ticket(), {
    id: 'ticket-id',
    description: 'Falla de prueba',
    asset: 'Prensa hidráulica',
    priority: TicketPriority.HIGH,
    status: TicketStatus.ASSIGNED,
  });
}

describe('TechniciansService', () => {
  const query = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  for (const method of [
    'leftJoinAndSelect',
    'where',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
  ] as const) {
    query[method].mockReturnValue(query);
  }
  const users = { createQueryBuilder: jest.fn(() => query) };
  const service = new TechniciansService(users as never);

  beforeEach(() => {
    jest.resetAllMocks();
    for (const method of [
      'leftJoinAndSelect',
      'where',
      'orderBy',
      'addOrderBy',
      'skip',
      'take',
    ] as const) {
      query[method].mockReturnValue(query);
    }
    users.createQueryBuilder.mockReturnValue(query);
  });

  it('derives BUSY only when an active ticket is present', async () => {
    query.getManyAndCount.mockResolvedValue([
      [technician([activeTicket()]), technician([])],
      2,
    ]);

    const response = await service.findAll({ page: 1, limit: 20 });

    expect(response.items.map((item) => item.availability)).toEqual([
      TechnicianAvailability.BUSY,
      TechnicianAvailability.AVAILABLE,
    ]);
    expect(query.leftJoinAndSelect).toHaveBeenCalledWith(
      'user.currentTickets',
      'currentTicket',
      'currentTicket.status IN (:...activeStatuses)',
      expect.objectContaining({
        activeStatuses: [
          TicketStatus.ASSIGNED,
          TicketStatus.IN_PROGRESS,
          TicketStatus.FREEZE_REQUESTED,
        ],
      }),
    );
  });
});
