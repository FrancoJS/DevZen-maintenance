import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKET_GATEWAY } from '../../../core/tickets/ticket.gateway';
import { ListMyTicketsResponse, TicketListItem } from '../../../core/tickets/ticket.models';
import { MyRequestsPageComponent } from './my-requests-page.component';

const tickets: TicketListItem[] = [
  {
    id: 'TK-OLD',
    asset: 'Bomba antigua',
    status: 'CLOSED',
    priority: 'LOW',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'TK-NEW',
    asset: 'Compresor nuevo',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    createdAt: '2026-08-26T10:00:00.000Z',
  },
];

describe('MyRequestsPageComponent', () => {
  let gateway: { listMyTickets: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    gateway = {
      listMyTickets: vi.fn(() => of({ tickets } satisfies ListMyTicketsResponse)),
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

  it('carga y ordena las solicitudes desde la más reciente', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.tickets().map((ticket) => ticket.id)).toEqual(['TK-NEW', 'TK-OLD']);
    expect(fixture.nativeElement.textContent).toContain('Compresor nuevo');
    expect(fixture.nativeElement.textContent).toContain('En proceso');
    expect(fixture.nativeElement.textContent).toContain('Crítica');
  });

  it('muestra el estado de carga mientras el gateway está pendiente', () => {
    const pendingResponse = new Subject<ListMyTicketsResponse>();
    gateway.listMyTickets.mockReturnValue(pendingResponse.asObservable());
    const fixture = createComponent();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Cargando tus solicitudes');

    pendingResponse.next({ tickets });
    pendingResponse.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('diferencia una cuenta sin solicitudes', () => {
    gateway.listMyTickets.mockReturnValue(of({ tickets: [] }));
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aún no tienes solicitudes');
    expect(fixture.nativeElement.textContent).toContain('Crear mi primera solicitud');
  });

  it('muestra un error recuperable y permite reintentar', () => {
    gateway.listMyTickets.mockReturnValueOnce(
      throwError(() => new Error('Sin conexión')) as Observable<ListMyTicketsResponse>
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('No pudimos mostrar tus solicitudes');

    gateway.listMyTickets.mockReturnValueOnce(of({ tickets }));
    fixture.componentInstance.loadTickets();
    fixture.detectChanges();

    expect(gateway.listMyTickets).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('TK-NEW');
  });

  it('busca por ticket o equipo y combina los filtros de estado y prioridad', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateQuery('compresor');
    component.updateStatus('IN_PROGRESS');
    component.updatePriority('CRITICAL');
    fixture.detectChanges();

    expect(component.filteredTickets().map((ticket) => ticket.id)).toEqual(['TK-NEW']);
    expect(component.hasActiveFilters()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('1 resultado de 2 solicitudes registradas');
  });

  it('restablece filtros y diferencia cuando no hay coincidencias', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.updateQuery('equipo inexistente');
    fixture.detectChanges();
    expect(component.filteredTickets()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No encontramos solicitudes con esos criterios');

    component.clearFilters();
    fixture.detectChanges();
    expect(component.filteredTickets()).toHaveLength(2);
    expect(component.hasActiveFilters()).toBe(false);
  });

  it.each([
    ['NEW', 'Nueva'],
    ['ASSIGNED', 'Asignada'],
    ['IN_PROGRESS', 'En proceso'],
    ['FREEZE_REQUESTED', 'Congelamiento solicitado'],
    ['FROZEN', 'Congelada'],
    ['PENDING_REASSIGNMENT', 'Pendiente de reasignación'],
    ['RESOLVED', 'Resuelta'],
    ['CLOSED', 'Cerrada'],
  ] as const)('expone el texto del estado %s', (status, label) => {
    const fixture = createComponent();
    expect(fixture.componentInstance.statusLabel(status)).toBe(label);
  });
});
