import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_TICKET_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  PaginatedTechniciansResponse,
  Technician,
  TicketDetail,
} from '../../../core/tickets/ticket.models';
import { AdminTicketDetailPageComponent } from './admin-ticket-detail-page.component';

const availableTechnician: Technician = {
  id: 'technician-available',
  name: 'Valentina Silva',
  email: 'valentina@devzen.test',
  availability: 'AVAILABLE',
  currentTicket: null,
};

const busyTechnician: Technician = {
  id: 'technician-busy',
  name: 'Diego Pérez',
  email: 'diego@devzen.test',
  availability: 'BUSY',
  currentTicket: {
    id: 'other-ticket',
    description: 'Trabajo activo',
    asset: 'Torno CNC T-05',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  },
};

const ticket: TicketDetail = {
  id: 'ticket-id',
  description: 'La bomba hidráulica no inicia.',
  location: 'Planta 2',
  asset: 'Bomba B-02',
  status: 'NEW',
  priority: 'HIGH',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'YES',
    productionImpact: 'REDUCED',
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
  maintenance: null,
  history: [
    {
      id: 'history-id',
      actor: { id: 'requester-id', name: 'Camila Rojas' },
      action: 'TICKET_CREATED',
      previousStatus: null,
      newStatus: 'NEW',
      previousPriority: null,
      newPriority: 'HIGH',
      details: null,
      createdAt: '2026-08-27T10:00:00.000Z',
    },
  ],
};

function technicianResponse(
  items: Technician[] = [availableTechnician, busyTechnician]
): PaginatedTechniciansResponse {
  return { items, page: 1, limit: 100, total: items.length, totalPages: 1 };
}

describe('AdminTicketDetailPageComponent', () => {
  let gateway: {
    getTicket: ReturnType<typeof vi.fn>;
    listTechnicians: ReturnType<typeof vi.fn>;
    assignTechnician: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      getTicket: vi.fn(() => of(ticket)),
      listTechnicians: vi.fn(() => of(technicianResponse())),
      assignTechnician: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminTicketDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'ticket-id' }) },
          },
        },
      ],
    })
      .overrideComponent(AdminTicketDetailPageComponent, {
        set: {
          providers: [{ provide: ADMIN_TICKET_GATEWAY, useValue: gateway }],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AdminTicketDetailPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el detalle, impacto, historial y disponibilidad técnica', () => {
    const fixture = createComponent();

    expect(gateway.getTicket).toHaveBeenCalledWith('ticket-id');
    expect(fixture.nativeElement.textContent).toContain('Bomba B-02');
    expect(fixture.nativeElement.textContent).toContain('Camila Rojas');
    expect(fixture.nativeElement.textContent).toContain('Ticket creado');
    expect(fixture.nativeElement.textContent).toContain(
      '1 técnicos disponibles de 2'
    );
  });

  it('muestra técnicos ocupados pero impide seleccionarlos', () => {
    const fixture = createComponent();
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('#ticket-technician option')
    ) as HTMLOptionElement[];

    const available = options.find(({ value }) => value === 'technician-available');
    const busy = options.find(({ value }) => value === 'technician-busy');
    expect(available?.disabled).toBe(false);
    expect(busy?.disabled).toBe(true);
    expect(busy?.textContent).toContain('Ocupado: Torno CNC T-05');
  });

  it('asigna un técnico disponible y refresca la disponibilidad tras confirmar el backend', () => {
    const assignedTicket: TicketDetail = {
      ...ticket,
      status: 'ASSIGNED',
      currentTechnician: {
        id: availableTechnician.id,
        name: availableTechnician.name,
      },
    };
    gateway.assignTechnician.mockReturnValue(of(assignedTicket));
    gateway.listTechnicians.mockReturnValueOnce(of(technicianResponse())).mockReturnValueOnce(
      of(
        technicianResponse([
          {
            ...availableTechnician,
            availability: 'BUSY',
            currentTicket: {
              id: ticket.id,
              description: ticket.description,
              asset: ticket.asset,
              priority: ticket.priority,
              status: 'ASSIGNED',
            },
          },
          busyTechnician,
        ])
      )
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateTechnician(availableTechnician.id);
    component.assignTechnician();
    fixture.detectChanges();

    expect(gateway.assignTechnician).toHaveBeenCalledWith(
      ticket.id,
      availableTechnician.id
    );
    expect(component.ticket()?.status).toBe('ASSIGNED');
    expect(component.assignmentSuccess()).toContain('Valentina Silva');
    expect(component.availableTechnicians()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain(
      'Confirmar asignación'
    );
  });

  it.each([
    [400, 'El técnico seleccionado no es válido'],
    [404, 'El ticket o el técnico ya no está disponible'],
    [409, 'el ticket cambió de estado o el técnico está ocupado'],
  ] as const)(
    'mantiene el ticket sin cambios cuando la asignación responde %s',
    (status, expectedMessage) => {
      gateway.assignTechnician.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status, statusText: 'Error' })
        ) as Observable<TicketDetail>
      );
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.updateTechnician(availableTechnician.id);
      component.assignTechnician();
      fixture.detectChanges();

      expect(component.ticket()?.status).toBe('NEW');
      expect(component.assignmentError()).toContain(expectedMessage);
      expect(component.assignmentSuccess()).toBeNull();
    }
  );

  it('no ofrece asignación para estados distintos de NEW', () => {
    gateway.getTicket.mockReturnValue(
      of({ ...ticket, status: 'RESOLVED' } satisfies TicketDetail)
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.querySelector('#ticket-technician')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Confirmar asignación'
    );
  });

  it('muestra un error recuperable cuando el ticket no existe', () => {
    const pendingTicket = new Subject<TicketDetail>();
    gateway.getTicket.mockReturnValueOnce(pendingTicket.asObservable());
    const fixture = createComponent();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    pendingTicket.error(
      new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'El ticket no existe o no está disponible para tu usuario'
    );
  });
});
