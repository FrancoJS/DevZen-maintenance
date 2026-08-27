import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PreviewSessionService } from '../preview-session.service';
import { TicketGateway } from './ticket.gateway';
import {
  CreateTicketRequest,
  PaginatedTicketsResponse,
  TicketDetail,
  TicketPriority,
  UpdateTicketRequest,
} from './ticket.models';
import { ListMyTicketsQuery } from './ticket.gateway';
import { MockTicketStore } from './mock-ticket.store';

/**
 * Temporary development adapter. It emulates the backend contract so the UI
 * can be developed independently; production code must provide an HTTP adapter.
 */
@Injectable()
export class MockTicketGateway implements TicketGateway {
  private readonly session = inject(PreviewSessionService);
  private readonly store = inject(MockTicketStore);

  createTicket(request: CreateTicketRequest): Observable<TicketDetail> {
    const priority = calculatePriority(request);
    const createdTicket = this.store.createForRequester(
      this.session.user().email,
      request,
      priority,
    );

    return of({
      ...createdTicket,
      description: request.description,
      location: request.location,
      asset: request.asset,
      requester: {
        id: this.session.user().email,
        name: this.session.user().name,
      },
      updatedAt: createdTicket.createdAt,
      impactAssessment: {
        ...request.impactAssessment,
        calculatedPriority: priority,
      },
      currentTechnician: null,
      resolvedBy: null,
      resolvedAt: null,
      closedBy: null,
      closedAt: null,
      assignments: [],
      maintenance: null,
      history: [],
    });
  }

  listMyTickets(query: ListMyTicketsQuery): Observable<PaginatedTicketsResponse> {
    const tickets = this.store
      .listForRequester(this.session.user().email)
      .filter((ticket) => !query.status || ticket.status === query.status)
      .filter((ticket) => !query.priority || ticket.priority === query.priority)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    const start = (query.page - 1) * query.limit;

    return of({
      items: tickets.slice(start, start + query.limit).map((ticket) => ({
        ...ticket,
        description: 'Solicitud de demostración',
        location: 'Ubicación de demostración',
        requester: {
          id: this.session.user().id,
          name: this.session.user().name,
        },
        updatedAt: ticket.createdAt,
      })),
      page: query.page,
      limit: query.limit,
      total: tickets.length,
      totalPages: Math.ceil(tickets.length / query.limit),
    });
  }

  getTicket(_id: string): Observable<TicketDetail> {
    return throwError(() => new Error('El detalle no está disponible en el adaptador mock.'));
  }

  updateTicket(
    _id: string,
    _request: UpdateTicketRequest
  ): Observable<TicketDetail> {
    return throwError(() => new Error('La edición no está disponible en el adaptador mock.'));
  }
}

export function calculatePriority(request: CreateTicketRequest): TicketPriority {
  const impact = request.impactAssessment;

  if (
    impact.safetyRisk ||
    (impact.productionImpact === 'STOPPED' && !impact.workaroundAvailable)
  ) {
    return 'CRITICAL';
  }

  if (
    impact.equipmentStopped === 'YES' ||
    impact.productionImpact === 'STOPPED' ||
    (impact.productionImpact === 'REDUCED' && !impact.workaroundAvailable) ||
    impact.affectsOtherAreas
  ) {
    return 'HIGH';
  }

  if (
    impact.equipmentStopped === 'PARTIAL' ||
    impact.productionImpact === 'REDUCED'
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}
