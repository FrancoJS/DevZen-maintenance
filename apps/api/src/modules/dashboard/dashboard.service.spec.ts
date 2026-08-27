import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TechniciansService } from '../technicians/technicians.service';
import { FreezeRequest } from '../tickets/entities/freeze-request.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { DashboardService } from './dashboard.service';

const admin: AuthenticatedUser = { id: 'admin-id', role: UserRole.ADMIN };

function ticketQuery(result: Record<string, string>) {
  const query = {
    select: jest.fn(),
    addSelect: jest.fn(),
    setParameters: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue(result),
  };
  for (const method of ['select', 'addSelect', 'setParameters'] as const) {
    query[method].mockReturnValue(query);
  }
  return query;
}

describe('DashboardService', () => {
  const dataSource = { transaction: jest.fn() } as unknown as DataSource;
  const techniciansService = {
    getCapacity: jest.fn(),
  } as unknown as TechniciansService;
  const service = new DashboardService(dataSource, techniciansService);

  beforeEach(() => jest.resetAllMocks());

  it('rejects non-administrators before querying data', async () => {
    await expect(
      service.findAdmin({ id: 'tech-id', role: UserRole.TECHNICIAN }),
    ).rejects.toEqual(
      new ForbiddenException('Solo un administrador puede consultar indicadores'),
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('returns administrative counts from one consistent read transaction', async () => {
    const query = ticketQuery({
      total: '12', new: '3', critical: '2', inProgress: '4', frozen: '1',
      pendingAssignment: '3', pendingReassignment: '2', pendingClosure: '1',
    });
    const freezeRequests = { count: jest.fn().mockResolvedValue(5) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Ticket) return { createQueryBuilder: jest.fn(() => query) };
        if (entity === FreezeRequest) return freezeRequests;
        return {};
      }),
    };
    (dataSource.transaction as jest.Mock).mockImplementation(
      (_isolationLevel, callback) => callback(manager),
    );
    (techniciansService.getCapacity as jest.Mock).mockResolvedValue({
      total: 4, available: 1, busy: 3,
    });

    await expect(service.findAdmin(admin)).resolves.toEqual({
      tickets: { total: 12, new: 3, critical: 2, inProgress: 4, frozen: 1 },
      technicians: { total: 4, available: 1, busy: 3 },
      requiresAttention: {
        pendingAssignment: 3, pendingFreezeApproval: 5,
        pendingReassignment: 2, pendingClosure: 1,
      },
    });
    expect(dataSource.transaction).toHaveBeenCalledWith(
      'REPEATABLE READ', expect.any(Function),
    );
  });
});
