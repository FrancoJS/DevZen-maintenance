import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TicketGateway } from './ticket.gateway';
import {
  CreateTicketRequest,
  CreateTicketResponse,
  TicketPriority,
} from './ticket.models';

/**
 * Temporary development adapter. It emulates the backend contract so the UI
 * can be developed independently; production code must provide an HTTP adapter.
 */
@Injectable()
export class MockTicketGateway implements TicketGateway {
  private nextTicketNumber = 1;

  createTicket(request: CreateTicketRequest): Observable<CreateTicketResponse> {
    const ticketNumber = String(this.nextTicketNumber++).padStart(4, '0');

    return of({
      ticket: {
        id: `TK-MOCK-${ticketNumber}`,
        status: 'NEW',
        priority: calculatePriority(request),
        createdAt: new Date().toISOString(),
      },
    });
  }
}

export function calculatePriority(request: CreateTicketRequest): TicketPriority {
  const impact = request.impactAssessment;
  const score =
    (impact.safetyRisk ? 10 : 0) +
    (impact.equipmentStopped === 'YES'
      ? 3
      : impact.equipmentStopped === 'PARTIAL'
        ? 1
        : 0) +
    (impact.productionImpact === 'STOPPED'
      ? 8
      : impact.productionImpact === 'REDUCED'
        ? 2
        : 0) +
    (!impact.workaroundAvailable ? 2 : 0) +
    (impact.affectsOtherAreas ? 1 : 0);

  if (score >= 10) {
    return 'CRITICAL';
  }

  if (score >= 3) {
    return 'HIGH';
  }

  if (score >= 1) {
    return 'MEDIUM';
  }

  return 'LOW';
}
