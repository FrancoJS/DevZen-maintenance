import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { ListTechniciansQueryDto } from './dto/list-technicians-query.dto';
import {
  PaginatedTechniciansResponseDto,
  TechnicianAvailability,
  TechnicianResponseDto,
} from './dto/technician-response.dto';

const ACTIVE_TICKET_STATUSES = [
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.FREEZE_REQUESTED,
] as const;

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async findAll(
    query: ListTechniciansQueryDto,
  ): Promise<PaginatedTechniciansResponseDto> {
    const [technicians, total] = await this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.currentTickets',
        'currentTicket',
        'currentTicket.status IN (:...activeStatuses)',
        { activeStatuses: ACTIVE_TICKET_STATUSES },
      )
      .where('user.role = :role', { role: UserRole.TECHNICIAN })
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      items: technicians.map((technician) => this.toResponse(technician)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private toResponse(technician: User): TechnicianResponseDto {
    const currentTicket = technician.currentTickets[0] ?? null;

    return {
      id: technician.id,
      name: technician.name,
      email: technician.email,
      availability: currentTicket
        ? TechnicianAvailability.BUSY
        : TechnicianAvailability.AVAILABLE,
      currentTicket: currentTicket
        ? {
            id: currentTicket.id,
            description: currentTicket.description,
            asset: currentTicket.asset,
            priority: currentTicket.priority,
            status: currentTicket.status,
          }
        : null,
    };
  }
}
