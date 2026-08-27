import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKET_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  PaginatedTicketsResponse,
  TicketDetail,
  TicketSummary,
} from '../../../core/tickets/ticket.models';
import { MyRequestsPageComponent } from './my-requests-page.component';

const tickets: TicketSummary[] = [
  {
    id: 'TK-NEW',
    description: 'Falla reciente',
    location: 'Planta 1',
    asset: 'Compresor nuevo',
    requester: { id: 'requester-id', name: 'Camila Rojas' },
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    createdAt: '2026-08-26T10:00:00.000Z',
    updatedAt: '2026-08-26T10:00:00.000Z',
  },
  {
    id: 'TK-OLD',
    description: 'Falla anterior',
    location: 'Planta 2',
    asset: 'Bomba antigua',
    requester: { id: 'requester-id', name: 'Camila Rojas' },
    status: 'CLOSED',
    priority: 'LOW',
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
];

const response: PaginatedTicketsResponse = {
  items: tickets,
  page: 1,
  limit: 20,
  total: 22,
  totalPages: 2,
};

const createdTicket: TicketDetail = {
  id: 'TK-CREATED',
  description: 'Solicitud creada desde el modal',
  location: 'Planta 3',
  asset: 'Bomba nueva',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  status: 'NEW',
  priority: 'HIGH',
  createdAt: '2026-08-27T12:00:00.000Z',
  updatedAt: '2026-08-27T12:00:00.000Z',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'YES',
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
  maintenance: null,
  history: [],
};

describe('MyRequestsPageComponent', () => {
  let gateway: {
    listMyTickets: ReturnType<typeof vi.fn>;
    getTicket: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listMyTickets: vi.fn(() => of(response)),
      getTicket: vi.fn(() => of(createdTicket)),
    };

    await TestBed.configureTestingModule({
      imports: [MyRequestsPageComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(MyRequestsPageComponent, {
        set: {
          providers: [{ provide: TICKET_GATEWAY, useValue: gateway }],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(MyRequestsPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga la página inicial desde el API y presenta su metadata', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(gateway.listMyTickets).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      priority: undefined,
    });
    expect(component.tickets().map((ticket) => ticket.id)).toEqual(['TK-NEW', 'TK-OLD']);
    expect(component.total()).toBe(22);
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 2');
    expect(fixture.nativeElement.textContent).toContain('Compresor nuevo');
    expect(fixture.nativeElement.textContent).toContain('En proceso');
  });

  it('muestra el estado de carga mientras el API está pendiente', () => {
    const pendingResponse = new Subject<PaginatedTicketsResponse>();
    gateway.listMyTickets.mockReturnValue(pendingResponse.asObservable());
    const fixture = createComponent();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Cargando tus solicitudes');

    pendingResponse.next(response);
    pendingResponse.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('diferencia una cuenta sin solicitudes', () => {
    gateway.listMyTickets.mockReturnValue(
      of({ ...response, items: [], total: 0, totalPages: 0 })
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aún no tienes solicitudes');
  });

  it('muestra un error recuperable y permite reintentar', () => {
    gateway.listMyTickets.mockReturnValueOnce(
      throwError(() => new Error('Sin conexión')) as Observable<PaginatedTicketsResponse>
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('No pudimos mostrar tus solicitudes');

    gateway.listMyTickets.mockReturnValueOnce(of(response));
    fixture.componentInstance.loadTickets();
    fixture.detectChanges();

    expect(gateway.listMyTickets).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('TK-NEW');
  });

  it('envía filtros al API y limita la búsqueda a la página cargada', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateQuery('compresor');
    component.updateStatus('IN_PROGRESS');
    component.updatePriority('CRITICAL');
    fixture.detectChanges();

    expect(gateway.listMyTickets).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    });
    expect(component.filteredTickets().map((ticket) => ticket.id)).toEqual(['TK-NEW']);
    expect(fixture.nativeElement.textContent).toContain('1 resultado en esta página de 22 solicitudes registradas');
  });

  it('restablece filtros, vuelve a la primera página y recarga', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.page.set(2);
    component.updateQuery('equipo inexistente');

    component.clearFilters();

    expect(component.page()).toBe(1);
    expect(component.hasActiveFilters()).toBe(false);
    expect(gateway.listMyTickets).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      priority: undefined,
    });
  });

  it('navega entre páginas disponibles', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.nextPage();
    expect(component.page()).toBe(2);
    expect(gateway.listMyTickets).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      status: undefined,
      priority: undefined,
    });

    component.previousPage();
    expect(component.page()).toBe(1);
  });

  it('abre el modal de creación y lista de inmediato el ticket creado', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openCreateModal();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    const refreshedList = new Subject<PaginatedTicketsResponse>();
    gateway.listMyTickets.mockReturnValueOnce(refreshedList.asObservable());
    component.onTicketCreated(createdTicket);
    fixture.detectChanges();

    expect(component.isCreateModalOpen()).toBe(false);
    expect(component.page()).toBe(1);
    expect(component.selectedStatus()).toBe('');
    expect(component.selectedPriority()).toBe('');
    expect(component.tickets().map((ticket) => ticket.id)).toContain('TK-CREATED');
    expect(component.total()).toBe(23);
    expect(fixture.nativeElement.textContent).toContain('Bomba nueva');

    refreshedList.next(response);
    refreshedList.complete();
  });

  it('obtiene y muestra el detalle del ticket seleccionado', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openTicketDetail('TK-NEW');
    fixture.detectChanges();

    expect(gateway.getTicket).toHaveBeenCalledWith('TK-NEW');
    expect(fixture.nativeElement.textContent).toContain('Detalle de la solicitud');
    expect(fixture.nativeElement.textContent).toContain('Solicitud creada desde el modal');
    expect(fixture.nativeElement.textContent).toContain('Historial');
  });

  it('muestra un error de detalle recuperable y permite reintentar', () => {
    gateway.getTicket.mockReturnValueOnce(
      throwError(() => new Error('Sin conexión')) as Observable<TicketDetail>
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openTicketDetail('TK-NEW');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos mostrar el detalle');
    gateway.getTicket.mockReturnValueOnce(of(createdTicket));
    component.loadTicketDetail('TK-NEW');
    fixture.detectChanges();

    expect(gateway.getTicket).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Solicitud creada desde el modal');
  });
});
