import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PreviewSessionService } from '../preview-session.service';
import { TicketGateway } from './ticket.gateway';
import {
  CreateTicketRequest,
  ListMyTicketsResponse,
  TicketDetail,
  TicketPriority,
} from './ticket.models';
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
      history: [],
    });
  }

  listMyTickets(): Observable<ListMyTicketsResponse> {
    return of({
      tickets: this.store.listForRequester(this.session.user().email),
    });
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
