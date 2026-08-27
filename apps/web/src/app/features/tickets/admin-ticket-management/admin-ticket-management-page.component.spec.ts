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
    assignTechnician: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listTickets: vi.fn(() => of(ticketResponse())),
      listTechnicians: vi.fn(() => of(technicianResponse())),
      assignTechnician: vi.fn(() =>
        of({ ...tickets[1], status: 'ASSIGNED' })
      ),
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
      Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
      ).some((button) => button.textContent === 'Acciones')
    ).toBe(true);
  });

  it('inicia ambas secciones cerradas y con controles accesibles', () => {
    const fixture = createComponent();
    const ticketsToggle = fixture.nativeElement.querySelector(
      '[data-testid="tickets-toggle"]'
    ) as HTMLButtonElement;
    const techniciansToggle = fixture.nativeElement.querySelector(
      '[data-testid="technicians-toggle"]'
    ) as HTMLButtonElement;
    const ticketsContent = fixture.nativeElement.querySelector(
      '#tickets-section-content'
    ) as HTMLElement;

    expect(ticketsToggle.getAttribute('aria-expanded')).toBe('false');
    expect(ticketsToggle.getAttribute('aria-controls')).toBe(
      'tickets-section-content'
    );
    expect(techniciansToggle.getAttribute('aria-expanded')).toBe('false');
    expect(ticketsContent.classList).not.toContain(
      'collapsible-content--expanded'
    );
  });

  it('permite abrir ambas secciones con transición y muestra disponibilidad y ticket actual', () => {
    const fixture = createComponent();
    const ticketsToggle = fixture.nativeElement.querySelector(
      '[data-testid="tickets-toggle"]'
    ) as HTMLButtonElement;
    const techniciansToggle = fixture.nativeElement.querySelector(
      '[data-testid="technicians-toggle"]'
    ) as HTMLButtonElement;
    const techniciansSection = fixture.nativeElement.querySelector(
      '[data-testid="technicians-section"]'
    ) as HTMLElement;
    const ticketsContent = fixture.nativeElement.querySelector(
      '#tickets-section-content'
    ) as HTMLElement;
    const techniciansContent = fixture.nativeElement.querySelector(
      '#technicians-section-content'
    ) as HTMLElement;

    ticketsToggle.click();
    techniciansToggle.click();
    fixture.detectChanges();

    expect(ticketsToggle.getAttribute('aria-expanded')).toBe('true');
    expect(techniciansToggle.getAttribute('aria-expanded')).toBe('true');
    expect(ticketsContent.classList).toContain('collapsible-content--expanded');
    expect(techniciansContent.classList).toContain(
      'collapsible-content--expanded'
    );
    expect(techniciansSection.textContent).toContain('Diego Pérez');
    expect(techniciansSection.textContent).toContain('Ocupado');
    expect(techniciansSection.textContent).toContain('Compresor C-12');
    expect(techniciansSection.textContent).toContain('En proceso');
    expect(techniciansSection.textContent).toContain('Crítica');
    expect(techniciansSection.textContent).toContain('Valentina Silva');
    expect(techniciansSection.textContent).toContain('Disponible');
    expect(techniciansSection.textContent).toContain('Sin ticket activo');
  });

  it('comparte los filtros de disponibilidad, estado y prioridad con técnicos', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateAssignment('WITH_TECHNICIAN');
    expect(component.filteredTickets().map(({ id }) => id)).toEqual([
      'ticket-assigned',
    ]);
    expect(component.filteredTechnicians().map(({ id }) => id)).toEqual([
      'technician-busy',
    ]);

    component.updateAssignment('WITHOUT_TECHNICIAN');
    expect(component.filteredTechnicians().map(({ id }) => id)).toEqual([
      'technician-available',
    ]);

    component.updateAssignment('');
    component.updateStatus('IN_PROGRESS');
    component.updatePriority('CRITICAL');
    expect(component.filteredTechnicians().map(({ id }) => id)).toEqual([
      'technician-busy',
    ]);
    expect(gateway.listTickets).toHaveBeenLastCalledWith({
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    });
  });

  it('abre el panel de Acciones con acceso al detalle', () => {
    const fixture = createComponent();
    const ticketsToggle = fixture.nativeElement.querySelector(
      '[data-testid="tickets-toggle"]'
    ) as HTMLButtonElement;

    ticketsToggle.click();
    fixture.detectChanges();

    const actionButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button'
      ) as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent === 'Acciones');

    expect(actionButton).toBeDefined();
    actionButton?.click();
    fixture.detectChanges();

    expect(document.body.textContent).toContain(
      'Cargando detalle y estado del equipo'
    );
    expect(document.body.textContent).not.toContain(
      '← Volver a Gestión de tickets'
    );
  });

  it('mantiene el modal durante la animación de cierre y bloquea el scroll de fondo', () => {
    vi.useFakeTimers();
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openActions(tickets[0]);
    expect(component.isActionsModalOpen()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    component.closeActions();
    expect(component.isActionsModalClosing()).toBe(true);
    expect(component.isActionsModalOpen()).toBe(true);

    vi.advanceTimersByTime(220);
    expect(component.isActionsModalOpen()).toBe(false);
    expect(component.selectedActionTicket()).toBeNull();
    expect(document.body.style.overflow).toBe('');
    vi.useRealTimers();
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

  it('conserva los valores seleccionados en los filtros durante la recarga', () => {
    const fixture = createComponent();
    const statusSelect = fixture.nativeElement.querySelector(
      '#admin-ticket-status'
    ) as HTMLSelectElement;
    const prioritySelect = fixture.nativeElement.querySelector(
      '#admin-ticket-priority'
    ) as HTMLSelectElement;
    const assignmentSelect = fixture.nativeElement.querySelector(
      '#admin-ticket-assignment'
    ) as HTMLSelectElement;

    statusSelect.value = 'IN_PROGRESS';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    prioritySelect.value = 'CRITICAL';
    prioritySelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    assignmentSelect.value = 'WITH_TECHNICIAN';
    assignmentSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(statusSelect.value).toBe('IN_PROGRESS');
    expect(prioritySelect.value).toBe('CRITICAL');
    expect(assignmentSelect.value).toBe('WITH_TECHNICIAN');
    expect(gateway.listTickets).toHaveBeenLastCalledWith({
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    });
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
