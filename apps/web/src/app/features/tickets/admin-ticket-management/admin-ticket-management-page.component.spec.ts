import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_TICKET_GATEWAY,
  AdminTicketFilters,
} from '../../../core/tickets/ticket.gateway';
import {
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  Technician,
  TicketSummary,
} from '../../../core/tickets/ticket.models';
import { AdminTicketManagementPageComponent } from './admin-ticket-management-page.component';

const tickets: TicketSummary[] = [
  {
    id: 'ticket-assigned',
    description: 'Falla en compresor',
    location: 'Planta 1',
    asset: 'Compresor C-12',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    requester: { id: 'requester-1', name: 'Camila Rojas' },
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T11:00:00.000Z',
  },
  {
    id: 'ticket-new',
    description: 'Bomba no inicia',
    location: 'Planta 2',
    asset: 'Bomba B-02',
    status: 'NEW',
    priority: 'HIGH',
    requester: { id: 'requester-2', name: 'Matías Vega' },
    createdAt: '2026-08-26T10:00:00.000Z',
    updatedAt: '2026-08-26T10:00:00.000Z',
  },
];

const technicians: Technician[] = [
  {
    id: 'technician-busy',
    name: 'Diego Pérez',
    email: 'diego@devzen.test',
    availability: 'BUSY',
    currentTicket: {
      id: 'ticket-assigned',
      description: 'Falla en compresor',
      asset: 'Compresor C-12',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
    },
  },
  {
    id: 'technician-available',
    name: 'Valentina Silva',
    email: 'valentina@devzen.test',
    availability: 'AVAILABLE',
    currentTicket: null,
  },
];

function ticketResponse(items = tickets): PaginatedTicketsResponse {
  return { items, page: 1, limit: 100, total: items.length, totalPages: 1 };
}

function technicianResponse(
  items = technicians
): PaginatedTechniciansResponse {
  return { items, page: 1, limit: 100, total: items.length, totalPages: 1 };
}

describe('AdminTicketManagementPageComponent', () => {
  let gateway: {
    listTickets: ReturnType<typeof vi.fn>;
    listTechnicians: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listTickets: vi.fn(() => of(ticketResponse())),
      listTechnicians: vi.fn(() => of(technicianResponse())),
    };

    await TestBed.configureTestingModule({
      imports: [AdminTicketManagementPageComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(AdminTicketManagementPageComponent, {
        set: {
          providers: [{ provide: ADMIN_TICKET_GATEWAY, useValue: gateway }],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AdminTicketManagementPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga tickets, resume disponibilidad y resuelve el técnico actual', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(gateway.listTickets).toHaveBeenCalledWith({
      status: undefined,
      priority: undefined,
    });
    expect(component.availableTechnicians()).toBe(1);
    expect(component.busyTechnicians()).toBe(1);
    expect(component.technicianName(tickets[0])).toBe('Diego Pérez');
    expect(fixture.nativeElement.textContent).toContain('Compresor C-12');
    expect(fixture.nativeElement.textContent).toContain('Camila Rojas');
    expect(
      fixture.nativeElement.querySelector('a[href="/tickets/ticket-assigned"]')
    ).not.toBeNull();
  });

  it('deriva el filtro de asignación desde los estados activos', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateAssignment('WITH_TECHNICIAN');
    fixture.detectChanges();
    expect(component.filteredTickets().map(({ id }) => id)).toEqual([
      'ticket-assigned',
    ]);

    component.updateAssignment('WITHOUT_TECHNICIAN');
    fixture.detectChanges();
    expect(component.filteredTickets().map(({ id }) => id)).toEqual([
      'ticket-new',
    ]);
  });

  it.each(['ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED'] as const)(
    'considera %s como una asignación activa',
    (status) => {
      const fixture = createComponent();
      expect(
        fixture.componentInstance.hasCurrentTechnician({
          ...tickets[0],
          status,
        })
      ).toBe(true);
    }
  );

  it('envía estado y prioridad al backend cuando cambian', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateStatus('IN_PROGRESS');
    component.updatePriority('CRITICAL');

    expect(gateway.listTickets).toHaveBeenLastCalledWith({
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    } satisfies AdminTicketFilters);
  });

  it('diferencia el estado vacío de una consulta sin coincidencias', () => {
    gateway.listTickets.mockReturnValue(of(ticketResponse([])));
    gateway.listTechnicians.mockReturnValue(of(technicianResponse([])));
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay tickets registrados'
    );

    gateway.listTickets.mockReturnValue(of(ticketResponse([tickets[1]])));
    gateway.listTechnicians.mockReturnValue(of(technicianResponse()));
    fixture.componentInstance.loadData();
    fixture.componentInstance.updateAssignment('WITH_TECHNICIAN');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay tickets con esos criterios'
    );
  });

  it('explica un resultado vacío devuelto por un filtro del backend', () => {
    gateway.listTickets.mockReturnValue(of(ticketResponse([])));
    const fixture = createComponent();

    fixture.componentInstance.updateStatus('CLOSED');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay tickets con esos criterios'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'No hay tickets registrados'
    );
  });

  it('muestra carga y permite reintentar después de un error', () => {
    const pendingTickets = new Subject<PaginatedTicketsResponse>();
    gateway.listTickets.mockReturnValueOnce(pendingTickets.asObservable());
    const fixture = createComponent();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Cargando tickets y disponibilidad'
    );

    pendingTickets.error(new Error('Sin conexión'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar la gestión de tickets'
    );

    gateway.listTickets.mockReturnValueOnce(of(ticketResponse()));
    gateway.listTechnicians.mockReturnValueOnce(of(technicianResponse()));
    fixture.componentInstance.loadData();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todos los tickets');
  });
});
