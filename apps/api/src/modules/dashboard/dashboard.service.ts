import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TechniciansService } from '../technicians/technicians.service';
import { FreezeRequest } from '../tickets/entities/freeze-request.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { FreezeRequestStatus } from '../tickets/enums/freeze-request-status.enum';
import { TicketPriority } from '../tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';

interface TicketCounts {
  total: string;
  new: string;
  critical: string;
  inProgress: string;
  frozen: string;
  pendingAssignment: string;
  pendingReassignment: string;
  pendingClosure: string;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly techniciansService: TechniciansService,
  ) {}

  async findAdmin(
    actor: AuthenticatedUser,
  ): Promise<AdminDashboardResponseDto> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo un administrador puede consultar indicadores',
      );
    }

    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const [ticketCounts, capacity, pendingFreezes] = await Promise.all([
        this.findTicketCounts(manager),
        this.techniciansService.getCapacity(manager),
        manager.getRepository(FreezeRequest).count({
          where: { status: FreezeRequestStatus.PENDING },
        }),
      ]);

      return {
        tickets: {
          total: Number(ticketCounts.total),
          new: Number(ticketCounts.new),
          critical: Number(ticketCounts.critical),
          inProgress: Number(ticketCounts.inProgress),
          frozen: Number(ticketCounts.frozen),
        },
        technicians: capacity,
        requiresAttention: {
          pendingAssignment: Number(ticketCounts.pendingAssignment),
          pendingFreezeApproval: pendingFreezes,
          pendingReassignment: Number(ticketCounts.pendingReassignment),
          pendingClosure: Number(ticketCounts.pendingClosure),
        },
      };
    });
  }

  private findTicketCounts(manager: EntityManager): Promise<TicketCounts> {
    return manager
      .getRepository(Ticket)
      .createQueryBuilder('ticket')
      .select('COUNT(ticket.id)', 'total')
      .addSelect(
        'COUNT(*) FILTER (WHERE ticket.status = :newStatus)',
        'new',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE ticket.priority = :criticalPriority
            AND ticket.status NOT IN (:...completedStatuses)
        )`,
        'critical',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE ticket.status = :inProgressStatus)',
        'inProgress',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE ticket.status = :frozenStatus)',
        'frozen',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE ticket.status = :newStatus
            AND ticket.currentTechnicianId IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM assignment_histories assignment
              WHERE assignment.ticket_id = ticket.id
                AND assignment.released_at IS NULL
            )
        )`,
        'pendingAssignment',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE ticket.status = :pendingReassignmentStatus)',
        'pendingReassignment',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE ticket.status = :resolvedStatus)',
        'pendingClosure',
      )
      .setParameters({
        newStatus: TicketStatus.NEW,
        criticalPriority: TicketPriority.CRITICAL,
        completedStatuses: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
        inProgressStatus: TicketStatus.IN_PROGRESS,
        frozenStatus: TicketStatus.FROZEN,
        pendingReassignmentStatus: TicketStatus.PENDING_REASSIGNMENT,
        resolvedStatus: TicketStatus.RESOLVED,
      })
      .getRawOne<TicketCounts>();
  }
}
