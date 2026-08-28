import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_FREEZE_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  FreezeRequestListItem,
  FreezeRequestsResponse,
  Technician,
  TicketDetail,
} from '../../../core/tickets/ticket.models';
import { AdminFreezeManagementPageComponent } from './admin-freeze-management-page.component';

const pendingRequest: FreezeRequestListItem = {
  id: 'freeze-pending',
  technician: { id: 'technician-id', name: 'Diego Pérez' },
  reasonType: 'SPARE_PART_UNAVAILABLE',
  reasonDetail: 'Se requiere sello mecánico compatible.',
  status: 'PENDING',
  requestedAt: '2026-08-27T10:00:00.000Z',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  ticket: {
    id: 'ticket-pending',
    description: 'La bomba pierde presión durante el ciclo.',
    asset: 'Bomba B-02',
    priority: 'HIGH',
    status: 'FREEZE_REQUESTED',
  },
};

const frozenRequest: FreezeRequestListItem = {
  ...pendingRequest,
  id: 'freeze-frozen',
  status: 'APPROVED',
  reviewedBy: { id: 'admin-id', name: 'Ana González' },
  reviewedAt: '2026-08-27T10:30:00.000Z',
  ticket: {
    ...pendingRequest.ticket,
    id: 'ticket-frozen',
    asset: 'Horno H-01',
    status: 'FROZEN',
  },
};

const resolvedRequest: FreezeRequestListItem = {
  ...frozenRequest,
  id: 'freeze-resolved',
  ticket: { ...frozenRequest.ticket, id: 'ticket-resolved', status: 'ASSIGNED' },
};

const availableTechnician: Technician = {
  id: 'available-technician',
  name: 'Valentina Silva',
  email: 'valentina@devzen.test',
  availability: 'AVAILABLE',
  currentTicket: null,
};

const busyTechnician: Technician = {
  id: 'busy-technician',
  name: 'Cristóbal Soto',
  email: 'cristobal@devzen.test',
  availability: 'BUSY',
  currentTicket: {
    id: 'other-ticket',
    description: 'Mantención activa',
    asset: 'Torno T-04',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
  },
};

function updatedTicket(status: TicketDetail['status']): TicketDetail {
  return {
    id: 'ticket-id',
    description: 'Descripción actualizada',
    location: 'Planta 1',
    asset: 'Equipo actualizado',
    status,
    priority: 'HIGH',
    requester: { id: 'requester-id', name: 'Camila Rojas' },
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
    impactAssessment: {
      safetyRisk: false,
      equipmentStopped: 'NO',
      productionImpact: 'NONE',
      workaroundAvailable: true,
      affectsOtherAreas: false,
      calculatedPriority: 'HIGH',
    },
    currentTechnician: null,
    resolvedBy: null,
    resolvedAt: null,
    closedBy: null,
    closedAt: null,
    assignments: [],
    freezeRequests: [],
    maintenance: null,
    finalEvidence: [],
    history: [],
  };
}

describe('AdminFreezeManagementPageComponent', () => {
  let gateway: {
    listFreezeRequests: ReturnType<typeof vi.fn>;
    listTechnicians: ReturnType<typeof vi.fn>;
    approveFreezeRequest: ReturnType<typeof vi.fn>;
    rejectFreezeRequest: ReturnType<typeof vi.fn>;
    resolveBlocker: ReturnType<typeof vi.fn>;
    assignTechnician: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listFreezeRequests: vi.fn(() =>
        of<FreezeRequestsResponse>({
          items: [pendingRequest, frozenRequest, resolvedRequest],
          total: 3,
        }),
      ),
      listTechnicians: vi.fn(() =>
        of({
          items: [availableTechnician, busyTechnician],
          page: 1,
          limit: 100,
          total: 2,
          totalPages: 1,
        }),
      ),
      approveFreezeRequest: vi.fn(),
      rejectFreezeRequest: vi.fn(),
      resolveBlocker: vi.fn(),
      assignTechnician: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminFreezeManagementPageComponent],
    })
      .overrideComponent(AdminFreezeManagementPageComponent, {
        set: {
          providers: [{ provide: ADMIN_FREEZE_GATEWAY, useValue: gateway }],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AdminFreezeManagementPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra una cola compacta con los datos mínimos de la solicitud', () => {
    const fixture = createComponent();

    expect(gateway.listFreezeRequests).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.actionableRequests()).toEqual([
      pendingRequest,
      frozenRequest,
    ]);
    expect(fixture.nativeElement.textContent).toContain('Bomba B-02');
    expect(fixture.nativeElement.textContent).toContain('Diego Pérez');
    expect(fixture.nativeElement.textContent).toContain('Falta de repuesto');
    expect(fixture.nativeElement.textContent).toContain('Gestionar');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Se requiere sello mecánico compatible.'
    );
    expect(fixture.nativeElement.textContent).not.toContain('Resolver bloqueo');
    expect(fixture.nativeElement.textContent).not.toContain('ticket-resolved');
  });

  it('abre un panel lateral con el detalle y las acciones de la solicitud seleccionada', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openRequest(pendingRequest);
    fixture.detectChanges();

    expect(component.selectedRequest()).toEqual(pendingRequest);
    expect(document.body.textContent).toContain('Gestión de congelamiento');
    expect(document.body.textContent).toContain(
      'Se requiere sello mecánico compatible.'
    );
    expect(document.body.textContent).toContain('Aprobar congelamiento');
  });

  it('muestra un estado vacío cuando no hay elementos accionables', () => {
    gateway.listFreezeRequests.mockReturnValue(
      of<FreezeRequestsResponse>({ items: [resolvedRequest], total: 1 })
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay congelamientos pendientes de gestión'
    );
  });

  it('muestra un error recuperable y permite reintentar la carga', () => {
    gateway.listFreezeRequests.mockReturnValueOnce(
      throwError(() => new Error('network'))
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar los congelamientos'
    );

    gateway.listFreezeRequests.mockReturnValueOnce(
      of<FreezeRequestsResponse>({ items: [pendingRequest], total: 1 })
    );
    fixture.componentInstance.loadData();
    fixture.detectChanges();

    expect(gateway.listFreezeRequests).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Bomba B-02');
  });

  it('aprueba la solicitud y refleja el estado FROZEN sin ofrecer reasignación', () => {
    gateway.approveFreezeRequest.mockReturnValue(of(updatedTicket('FROZEN')));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openRequest(pendingRequest);
    component.updateReviewNote(pendingRequest.id, 'Se aprobó la espera del repuesto.');
    component.approve(pendingRequest);
    fixture.detectChanges();

    expect(gateway.approveFreezeRequest).toHaveBeenCalledWith(
      pendingRequest.ticket.id,
      pendingRequest.id,
      { reviewNote: 'Se aprobó la espera del repuesto.' }
    );
    expect(component.freezeRequests()[0].status).toBe('APPROVED');
    expect(component.freezeRequests()[0].ticket.status).toBe('FROZEN');
    expect(component.selectedRequest()?.ticket.status).toBe('FROZEN');
    expect(document.body.textContent).toContain('Marcar bloqueo resuelto');
    expect(document.body.textContent).not.toContain('Confirmar reasignación');
  });

  it('exige un motivo antes de rechazar una solicitud', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openRequest(pendingRequest);
    component.reject(pendingRequest);
    fixture.detectChanges();

    expect(gateway.rejectFreezeRequest).not.toHaveBeenCalled();
    expect(component.actionError(pendingRequest.id)).toBe(
      'Indica el motivo del rechazo.'
    );
  });

  it('resuelve el bloqueo y permite reasignar solo técnicos disponibles', () => {
    gateway.resolveBlocker.mockReturnValue(of(updatedTicket('PENDING_REASSIGNMENT')));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openRequest(frozenRequest);
    component.resolveBlocker(frozenRequest);
    fixture.detectChanges();

    expect(gateway.resolveBlocker).toHaveBeenCalledWith(frozenRequest.ticket.id);
    expect(component.freezeRequests()[1].ticket.status).toBe(
      'PENDING_REASSIGNMENT'
    );
    expect(component.selectedRequest()?.ticket.status).toBe(
      'PENDING_REASSIGNMENT'
    );
    const options = Array.from(
      document.body.querySelectorAll(
        `#reassign-technician-${frozenRequest.id} option`
      )
    ) as HTMLOptionElement[];
    expect(
      options.find(({ value }) => value === availableTechnician.id)?.disabled
    ).toBe(false);
    expect(
      options.find(({ value }) => value === busyTechnician.id)?.disabled
    ).toBe(true);
  });

  it('reasigna un técnico disponible y retira el ticket de la cola', () => {
    gateway.listFreezeRequests.mockReturnValue(
      of<FreezeRequestsResponse>({ items: [{ ...frozenRequest, ticket: { ...frozenRequest.ticket, status: 'PENDING_REASSIGNMENT' } }], total: 1 })
    );
    gateway.assignTechnician.mockReturnValue(of(updatedTicket('ASSIGNED')));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openRequest({
      ...frozenRequest,
      ticket: { ...frozenRequest.ticket, status: 'PENDING_REASSIGNMENT' },
    });

    component.updateSelectedTechnician(frozenRequest.id, availableTechnician.id);
    component.assignTechnician({
      ...frozenRequest,
      ticket: { ...frozenRequest.ticket, status: 'PENDING_REASSIGNMENT' },
    });
    fixture.detectChanges();

    expect(gateway.assignTechnician).toHaveBeenCalledWith(
      frozenRequest.ticket.id,
      availableTechnician.id
    );
    expect(component.actionableRequests()).toHaveLength(0);
    expect(component.selectedRequest()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Valentina Silva fue reasignado correctamente.'
    );
  });

  it('muestra un error recuperable si la reasignación entra en conflicto', () => {
    gateway.listFreezeRequests.mockReturnValue(
      of<FreezeRequestsResponse>({ items: [{ ...frozenRequest, ticket: { ...frozenRequest.ticket, status: 'PENDING_REASSIGNMENT' } }], total: 1 })
    );
    gateway.assignTechnician.mockReturnValue(
      throwError(() => ({ status: 409 }))
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const request = {
      ...frozenRequest,
      ticket: { ...frozenRequest.ticket, status: 'PENDING_REASSIGNMENT' as const },
    };

    component.updateSelectedTechnician(request.id, availableTechnician.id);
    component.assignTechnician(request);
    fixture.detectChanges();

    expect(component.actionError(request.id)).toContain('cambió de estado');
  });

  it('cierra el panel después de rechazar una solicitud', () => {
    gateway.rejectFreezeRequest.mockReturnValue(of(updatedTicket('IN_PROGRESS')));
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.openRequest(pendingRequest);
    component.updateReviewNote(pendingRequest.id, 'La operación confirmó que puede continuar.');

    component.reject(pendingRequest);
    fixture.detectChanges();

    expect(component.selectedRequest()).toBeNull();
    expect(component.actionableRequests()).not.toContainEqual(
      expect.objectContaining({ id: pendingRequest.id })
    );
  });
});
