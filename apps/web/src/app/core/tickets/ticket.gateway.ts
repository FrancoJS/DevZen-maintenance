import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTicketRequest,
  ListMyTicketsResponse,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  TicketDetail,
  TicketPriority,
  TicketStatus,
} from './ticket.models';

/**
 * Boundary between ticket screens and the data source. The production adapter
 * will call POST /api/tickets; screens must not depend on that transport.
 */
export interface TicketGateway {
  createTicket(request: CreateTicketRequest): Observable<TicketDetail>;
  listMyTickets(): Observable<ListMyTicketsResponse>;
}

export const TICKET_GATEWAY = new InjectionToken<TicketGateway>('TICKET_GATEWAY');

export interface AdminTicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface AdminTicketGateway {
  listTickets(filters: AdminTicketFilters): Observable<PaginatedTicketsResponse>;
  listTechnicians(): Observable<PaginatedTechniciansResponse>;
  getTicket(id: string): Observable<TicketDetail>;
  assignTechnician(id: string, technicianId: string): Observable<TicketDetail>;
}

export const ADMIN_TICKET_GATEWAY = new InjectionToken<AdminTicketGateway>(
  'ADMIN_TICKET_GATEWAY'
);
