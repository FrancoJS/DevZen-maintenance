import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_TICKET_HISTORY_GATEWAY,
  AdminTicketHistoryGateway,
} from '../../../core/tickets/ticket.gateway';
import {
  GlobalTicketHistoryResponse,
  TicketDetail,
} from '../../../core/tickets/ticket.models';
import { MaintenanceHistoryPageComponent } from './maintenance-history-page.component';

const normalTicket: TicketDetail = {
  id: 'ticket-2048',
  ticketCode: 'TCK-2048',
  description: 'El compresor pierde presión durante la operación.',
  location: 'Planta 2',
  asset: 'Compresor C-12',
  status: 'CLOSED',
  priority: 'HIGH',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  createdAt: '2026-08-24T08:50:00.000Z',
  updatedAt: '2026-08-25T08:15:00.000Z',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'YES',
    productionImpact: 'REDUCED',
    workaroundAvailable: false,
    affectsOtherAreas: false,
    calculatedPriority: 'HIGH',
  },
  currentTechnician: null,
  resolvedBy: { id: 'tech-diego', name: 'Diego Pérez' },
  resolvedAt: '2026-08-24T13:45:00.000Z',
  closedBy: { id: 'admin-id', name: 'Ana González' },
  closedAt: '2026-08-25T08:15:00.000Z',
  assignments: [
    {
      id: 'assignment-diego',
      technician: { id: 'tech-diego', name: 'Diego Pérez' },
      assignedBy: { id: 'admin-id', name: 'Ana González' },
      assignedAt: '2026-08-24T09:30:00.000Z',
      startedAt: '2026-08-24T09:45:00.000Z',
      releasedAt: '2026-08-24T13:45:00.000Z',
      releaseReason: 'RESOLVED',
    },
  ],
  freezeRequests: [],
  maintenance: {
    diagnosis: 'Regulador de presión defectuoso.',
    workPerformed: 'Se reemplazó el regulador.',
    notes: null,
  },
  finalEvidence: [],
  history: [
    {
      id: 'history-created',
      actor: { id: 'requester-id', name: 'Camila Rojas' },
      action: 'TICKET_CREATED',
      previousStatus: null,
      newStatus: 'NEW',
      previousPriority: null,
      newPriority: 'HIGH',
      details: null,
      createdAt: '2026-08-24T08:50:00.000Z',
    },
    {
      id: 'history-closed',
      actor: { id: 'admin-id', name: 'Ana González' },
      action: 'TICKET_CLOSED',
      previousStatus: 'RESOLVED',
      newStatus: 'CLOSED',
      previousPriority: null,
      newPriority: null,
      details: { note: 'Cierre administrativo confirmado.' },
      createdAt: '2026-08-25T08:15:00.000Z',
    },
  ],
};

const reassignedTicket: TicketDetail = {
  ...normalTicket,
  id: 'ticket-2019',
  ticketCode: 'TCK-2019',
  asset: 'Transportador T-04',
  priority: 'MEDIUM',
  assignments: [
    {
      ...normalTicket.assignments[0],
      id: 'assignment-valentina',
      technician: { id: 'tech-valentina', name: 'Valentina Silva' },
    },
  ],
};

function response(items: TicketDetail[] = [normalTicket, reassignedTicket]): GlobalTicketHistoryResponse {
  return { items, total: items.length };
}

async function createComponent(
  gateway: Pick<AdminTicketHistoryGateway, 'listGlobalClosedHistory'>
) {
  await TestBed.configureTestingModule({
    imports: [MaintenanceHistoryPageComponent],
  })
    .overrideComponent(MaintenanceHistoryPageComponent, {
      set: {
        providers: [
          { provide: ADMIN_TICKET_HISTORY_GATEWAY, useValue: gateway },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(MaintenanceHistoryPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('MaintenanceHistoryPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('loads the closed-ticket history once and shows backend records', async () => {
    const gateway = {
      listGlobalClosedHistory: vi.fn(() => of(response())),
    };
    const fixture = await createComponent(gateway);
    const component = fixture.componentInstance;

    expect(gateway.listGlobalClosedHistory).toHaveBeenCalledTimes(1);
    expect(component.records().map((ticket) => ticket.ticketCode)).toEqual([
      'TCK-2048',
      'TCK-2019',
    ]);
    expect(fixture.nativeElement.textContent).toContain('2 de 2 tickets cerrados');
    expect(fixture.nativeElement.querySelector('#history-status')).toBeNull();
  });

  it('filters by search, priority and participating technician in backend order', async () => {
    const fixture = await createComponent({
      listGlobalClosedHistory: vi.fn(() => of(response())),
    });
    const component = fixture.componentInstance;

    expect(component.technicianOptions()).toEqual([
      { id: 'tech-diego', name: 'Diego Pérez' },
      { id: 'tech-valentina', name: 'Valentina Silva' },
    ]);

    component.updateQuery('transportador');
    component.updatePriority('MEDIUM');
    component.updateTechnician('tech-valentina');

    expect(component.records().map((ticket) => ticket.ticketCode)).toEqual([
      'TCK-2019',
    ]);
  });

  it('distinguishes an empty backend history from empty filter results', async () => {
    const fixture = await createComponent({
      listGlobalClosedHistory: vi.fn(() => of(response([]))),
    });
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain(
      'No hay tickets cerrados para mostrar.'
    );

    component.tickets.set(response().items);
    component.total.set(2);
    component.updateQuery('equipo inexistente');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No encontramos tickets con esos criterios.'
    );
  });

  it('shows an error and retries the request', async () => {
    const gateway = {
      listGlobalClosedHistory: vi
        .fn<() => Observable<GlobalTicketHistoryResponse>>()
        .mockReturnValueOnce(
          throwError(() => new HttpErrorResponse({ status: 500 }))
        )
        .mockReturnValueOnce(of(response())),
    };
    const fixture = await createComponent(gateway);
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar el historial global'
    );

    component.loadHistory();
    fixture.detectChanges();

    expect(gateway.listGlobalClosedHistory).toHaveBeenCalledTimes(2);
    expect(component.records()).toHaveLength(2);
  });

  it('shows loading state and opens the read-only traceability panel', async () => {
    const pending = new Subject<GlobalTicketHistoryResponse>();
    const fixture = await createComponent({
      listGlobalClosedHistory: vi.fn(() => pending),
    });
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain('Cargando tickets cerrados…');

    pending.next(response());
    pending.complete();
    fixture.detectChanges();
    component.openTicket(normalTicket);
    fixture.detectChanges();

    expect(component.selectedTicket()?.id).toBe(normalTicket.id);
    expect(document.body.textContent).toContain('Cierre administrativo confirmado.');
    expect(document.body.textContent).toContain('Diego Pérez');

    component.onSheetStateChange('closed');
    expect(component.selectedTicket()).toBeNull();
  });
});
