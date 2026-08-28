import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../api.config';
import { HttpTicketGateway } from './http-ticket.gateway';
import {
  CreateTicketRequest,
  FreezeRequestsResponse,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  TicketDetail,
} from './ticket.models';

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
  currentTechnician: null,
  resolvedBy: null,
  resolvedAt: null,
  closedBy: null,
  closedAt: null,
  assignments: [],
  freezeRequests: [],
  maintenance: null,
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

  it('lists the authenticated user tickets with page, status and priority filters', () => {
    const paginatedResponse: PaginatedTicketsResponse = {
      items: [],
      page: 2,
      limit: 20,
      total: 25,
      totalPages: 2,
    };

    gateway
      .listMyTickets({
        page: 2,
        limit: 20,
        status: 'NEW',
        priority: 'CRITICAL',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${API_BASE_URL}/tickets` &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '20' &&
        candidate.params.get('status') === 'NEW' &&
        candidate.params.get('priority') === 'CRITICAL'
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(paginatedResponse);
  });

  it('lists up to 100 tickets using the supported backend filters', () => {
    const response: PaginatedTicketsResponse = {
      items: [],
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    };

    gateway
      .listTickets({ status: 'NEW', priority: 'CRITICAL' })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${API_BASE_URL}/tickets` &&
        candidate.params.get('page') === '1' &&
        candidate.params.get('limit') === '100' &&
        candidate.params.get('status') === 'NEW' &&
        candidate.params.get('priority') === 'CRITICAL'
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(response);
  });

  it('lists up to 100 technicians for the administrative summary', () => {
    const response: PaginatedTechniciansResponse = {
      items: [],
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    };

    gateway.listTechnicians().subscribe();

    const pendingRequest = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${API_BASE_URL}/technicians` &&
        candidate.params.get('page') === '1' &&
        candidate.params.get('limit') === '100'
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(response);
  });

  it('gets an administrative ticket detail', () => {
    gateway.getTicket(response.id).subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}`
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(response);
  });

  it('updates only the ticket description', () => {
    gateway
      .updateTicket(response.id, { description: 'Descripción corregida.' })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}`
    );
    expect(pendingRequest.request.method).toBe('PATCH');
    expect(pendingRequest.request.body).toEqual({
      description: 'Descripción corregida.',
    });
    pendingRequest.flush({ ...response, description: 'Descripción corregida.' });
  });

  it('assigns the selected technician without sending derived fields', () => {
    gateway.assignTechnician(response.id, 'technician-id').subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/assign`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({
      technicianId: 'technician-id',
    });
    pendingRequest.flush({
      ...response,
      status: 'ASSIGNED',
      currentTechnician: { id: 'technician-id', name: 'Diego Pérez' },
    });
  });

  it('lists the administrative freeze queue', () => {
    const freezeRequests: FreezeRequestsResponse = { items: [], total: 0 };
    gateway.listFreezeRequests().subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/freeze-requests`
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(freezeRequests);
  });

  it('sends an optional note when approving a freeze request', () => {
    gateway
      .approveFreezeRequest(response.id, 'freeze-request-id', {
        reviewNote: 'Esperar recepción del repuesto',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/freeze-requests/freeze-request-id/approve`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({
      reviewNote: 'Esperar recepción del repuesto',
    });
    pendingRequest.flush({ ...response, status: 'FROZEN' });
  });

  it('sends the required rejection reason for a freeze request', () => {
    gateway
      .rejectFreezeRequest(response.id, 'freeze-request-id', {
        reviewNote: 'La operación autorizó continuar el trabajo.',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/freeze-requests/freeze-request-id/reject`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({
      reviewNote: 'La operación autorizó continuar el trabajo.',
    });
    pendingRequest.flush({ ...response, status: 'IN_PROGRESS' });
  });

  it('marks a frozen ticket blocker as resolved without client-derived fields', () => {
    gateway.resolveBlocker(response.id).subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/resolve-blocker`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({});
    pendingRequest.flush({ ...response, status: 'PENDING_REASSIGNMENT' });
  });

  it('gets the current maintenance for the authenticated technician', () => {
    gateway.getCurrentMaintenance().subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/my-maintenance`
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush({ ticket: response });
  });

  it('starts the selected maintenance without sending derived fields', () => {
    gateway.startMaintenance(response.id).subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/start`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({});
    pendingRequest.flush({ ...response, status: 'IN_PROGRESS' });
  });

  it('updates only the supplied maintenance fields', () => {
    gateway
      .updateMaintenance(response.id, {
        diagnosis: 'Válvula de descarga bloqueada',
        notes: null,
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/maintenance`
    );
    expect(pendingRequest.request.method).toBe('PATCH');
    expect(pendingRequest.request.body).toEqual({
      diagnosis: 'Válvula de descarga bloqueada',
      notes: null,
    });
    expect(pendingRequest.request.body).not.toHaveProperty('workPerformed');
    pendingRequest.flush({ ...response, status: 'IN_PROGRESS' });
  });

  it('requests a freeze using the documented reason payload', () => {
    gateway
      .requestFreeze(response.id, {
        reasonType: 'OTHER',
        reasonDetail: 'Se requiere inspección externa',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/freeze-requests`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({
      reasonType: 'OTHER',
      reasonDetail: 'Se requiere inspección externa',
    });
    pendingRequest.flush({ ...response, status: 'FREEZE_REQUESTED' });
  });

  it('resolves a maintenance with only the final work performed', () => {
    gateway
      .resolveMaintenance(response.id, {
        workPerformed: 'Se reemplazó la válvula de descarga',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      `${API_BASE_URL}/tickets/${response.id}/resolve`
    );
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual({
      workPerformed: 'Se reemplazó la válvula de descarga',
    });
    pendingRequest.flush({ ...response, status: 'RESOLVED' });
  });

  it('lists the authenticated technician maintenance history with backend filters', () => {
    gateway
      .listMaintenanceHistory({
        page: 2,
        limit: 20,
        status: 'FROZEN',
        priority: 'HIGH',
      })
      .subscribe();

    const pendingRequest = httpTesting.expectOne(
      (candidate) =>
        candidate.url ===
          `${API_BASE_URL}/tickets/my-maintenance-history` &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '20' &&
        candidate.params.get('status') === 'FROZEN' &&
        candidate.params.get('priority') === 'HIGH'
    );
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush({
      items: [],
      page: 2,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });
});
