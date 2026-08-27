import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKET_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  PaginatedTicketsResponse,
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

describe('MyRequestsPageComponent', () => {
  let gateway: { listMyTickets: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    gateway = {
      listMyTickets: vi.fn(() => of(response)),
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
});
