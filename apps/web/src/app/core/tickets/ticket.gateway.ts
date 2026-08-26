import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTicketRequest, CreateTicketResponse } from './ticket.models';

/**
 * Boundary between ticket screens and the data source. The production adapter
 * will call POST /api/tickets; screens must not depend on that transport.
 */
export interface TicketGateway {
  createTicket(request: CreateTicketRequest): Observable<CreateTicketResponse>;
}

export const TICKET_GATEWAY = new InjectionToken<TicketGateway>('TICKET_GATEWAY');
