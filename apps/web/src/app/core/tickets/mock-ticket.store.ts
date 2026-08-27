import { Injectable } from '@angular/core';
import {
  CreateTicketRequest,
  TicketListItem,
  TicketPriority,
  TicketStatus,
} from './ticket.models';

interface StoredCreatedTicket {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

interface OwnedTicket extends TicketListItem {
  requesterEmail: string;
}

const DEMO_TICKETS: OwnedTicket[] = [
  {
    id: 'TK-1024',
    asset: 'Bomba hidráulica B-07',
    status: 'NEW',
    priority: 'HIGH',
    createdAt: '2026-08-26T13:20:00.000Z',
    requesterEmail: 'camila.rojas@devzen.test',
  },
  {
    id: 'TK-1018',
    asset: 'Compresor C-12',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    createdAt: '2026-08-24T10:15:00.000Z',
    requesterEmail: 'camila.rojas@devzen.test',
  },
  {
    id: 'TK-0996',
    asset: 'Cinta transportadora CT-03',
    status: 'CLOSED',
    priority: 'MEDIUM',
    createdAt: '2026-08-12T15:45:00.000Z',
    requesterEmail: 'camila.rojas@devzen.test',
  },
  {
    id: 'TK-1031',
    asset: 'Torno CNC T-05',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    createdAt: '2026-08-25T16:10:00.000Z',
    requesterEmail: 'diego.perez@devzen.test',
  },
  {
    id: 'TK-0974',
    asset: 'Extractor industrial EX-02',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: '2026-08-08T09:30:00.000Z',
    requesterEmail: 'diego.perez@devzen.test',
  },
  {
    id: 'TK-1028',
    asset: 'Horno industrial H-01',
    status: 'FREEZE_REQUESTED',
    priority: 'HIGH',
    createdAt: '2026-08-25T11:40:00.000Z',
    requesterEmail: 'ana.gonzalez@devzen.test',
  },
  {
    id: 'TK-0952',
    asset: 'Prensa hidráulica PH-04',
    status: 'PENDING_REASSIGNMENT',
    priority: 'CRITICAL',
    createdAt: '2026-08-03T14:05:00.000Z',
    requesterEmail: 'ana.gonzalez@devzen.test',
  },
];

@Injectable({ providedIn: 'root' })
export class MockTicketStore {
  private readonly tickets = DEMO_TICKETS.map((ticket) => ({ ...ticket }));
  private nextTicketNumber = 1;

  listForRequester(requesterEmail: string): TicketListItem[] {
    return this.tickets
      .filter((ticket) => ticket.requesterEmail === requesterEmail)
      .map((ticket) => ({
        id: ticket.id,
        asset: ticket.asset,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      }));
  }

  createForRequester(
    requesterEmail: string,
    request: CreateTicketRequest,
    priority: TicketPriority
  ): StoredCreatedTicket {
    const ticket: OwnedTicket = {
      id: `TK-MOCK-${String(this.nextTicketNumber++).padStart(4, '0')}`,
      asset: request.asset,
      status: 'NEW',
      priority,
      createdAt: new Date().toISOString(),
      requesterEmail,
    };

    this.tickets.push(ticket);

    return {
      id: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    };
  }
}
