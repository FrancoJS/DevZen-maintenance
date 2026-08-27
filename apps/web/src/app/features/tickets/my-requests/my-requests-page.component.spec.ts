import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKET_GATEWAY } from '../../../core/tickets/ticket.gateway';
import { PreviewSessionService } from '../../../core/preview-session.service';
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
  limit: 10,
  total: 22,
  totalPages: 3,
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

const editableTicket: TicketDetail = {
  ...createdTicket,
  id: 'TK-NEW',
  description: 'Falla reciente',
  asset: 'Compresor nuevo',
  location: 'Planta 1',
};

describe('MyRequestsPageComponent', () => {
  let gateway: {
    listMyTickets: ReturnType<typeof vi.fn>;
    getTicket: ReturnType<typeof vi.fn>;
    updateTicket: ReturnType<typeof vi.fn>;
  };
  let queryParamMap$: Subject<ParamMap>;

  beforeEach(async () => {
    queryParamMap$ = new Subject<ParamMap>();
    gateway = {
      listMyTickets: vi.fn(() => of(response)),
      getTicket: vi.fn(() => of(createdTicket)),
      updateTicket: vi.fn(() => of(editableTicket)),
    };

    await TestBed.configureTestingModule({
      imports: [MyRequestsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$.asObservable() } },
      ],
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
      limit: 10,
      status: undefined,
      priority: undefined,
    });
    expect(component.tickets().map((ticket) => ticket.id)).toEqual(['TK-NEW', 'TK-OLD']);
    expect(component.total()).toBe(22);
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 3');
    expect(fixture.nativeElement.querySelector('nav[aria-label="Paginación de solicitudes"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Siguiente');
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
      limit: 10,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    });
    expect(component.filteredTickets().map((ticket) => ticket.id)).toEqual(['TK-NEW']);
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1–10 de 22');
    expect(fixture.nativeElement.textContent).toContain('1 resultado visible en esta página');
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
      limit: 10,
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
      limit: 10,
      status: undefined,
      priority: undefined,
    });

    component.previousPage();
    expect(component.page()).toBe(1);
  });

  it('permite seleccionar una página numerada desde la paginación Spartan', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.pageLinks()).toEqual([1, 2, 3]);
    component.goToPage(2);

    expect(component.page()).toBe(2);
    expect(gateway.listMyTickets).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
      status: undefined,
      priority: undefined,
    });
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

  it('cierra el modal cuando llega la confirmación de creación aunque el finalize siga pendiente', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.openCreateModal();
    fixture.detectChanges();
    component.createTicketPage?.isSubmitting.set(true);

    component.onTicketCreated(createdTicket);

    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('abre el modal al recibir el parámetro create de una ruta histórica', () => {
    const fixture = createComponent();

    queryParamMap$.next(convertToParamMap({ create: '1' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isCreateModalOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('protege los datos ingresados antes de cerrar el modal de creación', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.openCreateModal();
    fixture.detectChanges();
    component.createTicketPage?.form.controls.description.setValue('Falla en el motor');
    component.createTicketPage?.form.markAsDirty();

    component.closeCreateModal();
    fixture.detectChanges();

    expect(component.isCreateModalOpen()).toBe(true);
    expect(component.isDiscardConfirmationOpen()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('¿Descartar esta solicitud?');

    component.cancelDiscardCreateForm();
    expect(component.isCreateModalOpen()).toBe(true);
    component.discardCreateForm();
    expect(component.isCreateModalOpen()).toBe(false);
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

  it('solo permite editar al propietario cuando el ticket está NEW', () => {
    const session = TestBed.inject(PreviewSessionService);
    session.loginFromApi(
      {
        id: 'requester-id',
        name: 'Camila Rojas',
        email: 'camila.rojas@devzen.test',
        role: 'REQUESTER',
      },
      'access-token'
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.canEdit({ ...tickets[0], status: 'NEW' })).toBe(true);
    expect(component.canEdit(tickets[0])).toBe(false);
    expect(component.canEdit({ ...tickets[1], status: 'NEW', requester: { id: 'other-user', name: 'Otro usuario' } })).toBe(false);
  });

  it('actualiza la descripción propia NEW y sincroniza el listado', () => {
    const session = TestBed.inject(PreviewSessionService);
    session.loginFromApi(
      {
        id: 'requester-id',
        name: 'Camila Rojas',
        email: 'camila.rojas@devzen.test',
        role: 'REQUESTER',
      },
      'access-token'
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const editableSummary = { ...tickets[0], status: 'NEW' as const };
    gateway.updateTicket.mockReturnValueOnce(
      of({ ...editableTicket, description: 'Descripción corregida.' })
    );

    component.openEditModal(editableSummary);
    component.editForm.setValue({ description: 'Descripción corregida.' });
    component.submitEdit();
    fixture.detectChanges();

    expect(gateway.updateTicket).toHaveBeenCalledWith('TK-NEW', {
      description: 'Descripción corregida.',
    });
    expect(component.isEditModalOpen()).toBe(false);
    expect(component.tickets().find((ticket) => ticket.id === 'TK-NEW')?.description).toBe('Descripción corregida.');
  });

  it('conserva el formulario y recarga la lista si la edición falla', () => {
    const session = TestBed.inject(PreviewSessionService);
    session.loginFromApi(
      {
        id: 'requester-id',
        name: 'Camila Rojas',
        email: 'camila.rojas@devzen.test',
        role: 'REQUESTER',
      },
      'access-token'
    );
    gateway.updateTicket.mockReturnValueOnce(
      throwError(() => new Error('El ticket ya fue asignado')) as Observable<TicketDetail>
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.openEditModal({ ...tickets[0], status: 'NEW' });
    component.editForm.setValue({ description: 'Texto que se conserva' });
    component.submitEdit();
    fixture.detectChanges();

    expect(component.isEditModalOpen()).toBe(true);
    expect(component.editForm.controls.description.value).toBe('Texto que se conserva');
    expect(fixture.nativeElement.textContent).toContain('No fue posible actualizar la solicitud');
    expect(gateway.listMyTickets).toHaveBeenCalledTimes(2);
  });
});
