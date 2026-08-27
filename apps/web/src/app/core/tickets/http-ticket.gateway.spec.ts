import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../api.config';
import { HttpTicketGateway } from './http-ticket.gateway';
import { CreateTicketRequest, TicketDetail } from './ticket.models';

const request: CreateTicketRequest = {
  description: 'La bomba hidráulica no inicia.',
  location: 'Planta 2',
  asset: 'Bomba B-02',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'NO',
    productionImpact: 'NONE',
    workaroundAvailable: true,
    affectsOtherAreas: false,
  },
};

const response: TicketDetail = {
  id: '54f1c1b7-2acf-4428-a2f7-58b2943fb044',
  description: request.description,
  location: request.location,
  asset: request.asset,
  status: 'NEW',
  priority: 'LOW',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  createdAt: '2026-08-27T01:00:00.000Z',
  updatedAt: '2026-08-27T01:00:00.000Z',
  impactAssessment: {
    ...request.impactAssessment,
    calculatedPriority: 'LOW',
  },
  history: [],
};

describe('HttpTicketGateway', () => {
  let gateway: HttpTicketGateway;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpTicketGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    gateway = TestBed.inject(HttpTicketGateway);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the exact backend payload and returns its direct response', () => {
    let createdTicket: TicketDetail | undefined;
    gateway.createTicket(request).subscribe((ticket) => {
      createdTicket = ticket;
    });

    const pendingRequest = httpTesting.expectOne(`${API_BASE_URL}/tickets`);
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual(request);
    expect(pendingRequest.request.body).not.toHaveProperty('area');
    expect(pendingRequest.request.body).not.toHaveProperty('priority');
    expect(pendingRequest.request.body).not.toHaveProperty('requester');
    pendingRequest.flush(response);

    expect(createdTicket).toEqual(response);
  });
});
