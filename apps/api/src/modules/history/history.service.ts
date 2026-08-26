import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TicketPriority } from '../tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';
import { TicketHistoryAction } from './enums/ticket-history-action.enum';
import { TicketHistory } from './entities/ticket-history.entity';

export interface CreateTicketHistoryEvent {
  ticketId: string;
  actorId: string;
  action: TicketHistoryAction;
  previousStatus?: TicketStatus | null;
  newStatus?: TicketStatus | null;
  previousPriority?: TicketPriority | null;
  newPriority?: TicketPriority | null;
  details?: Record<string, unknown> | null;
}

@Injectable()
export class HistoryService {
  async record(
    manager: EntityManager,
    event: CreateTicketHistoryEvent,
  ): Promise<TicketHistory> {
    const repository = manager.getRepository(TicketHistory);
    return repository.save(
      repository.create({
        ...event,
        previousStatus: event.previousStatus ?? null,
        newStatus: event.newStatus ?? null,
        previousPriority: event.previousPriority ?? null,
        newPriority: event.newPriority ?? null,
        details: event.details ?? null,
      }),
    );
  }
}
