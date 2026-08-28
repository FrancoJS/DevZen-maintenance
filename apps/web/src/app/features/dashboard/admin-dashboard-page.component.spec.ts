import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/api.config';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { AdminDashboardResponse } from './admin-dashboard.service';
import { PaginatedTechniciansResponse } from '../../core/tickets/ticket.models';

const response: AdminDashboardResponse = {
  tickets: { total: 301, new: 21, critical: 7, inProgress: 12, frozen: 5 },
  technicians: { total: 40, available: 28, busy: 12 },
  requiresAttention: {
    pendingAssignment: 20,
    pendingFreezeApproval: 3,
    pendingReassignment: 4,
    pendingClosure: 9,
  },
};

const techniciansResponse: PaginatedTechniciansResponse = {
  items: [
    {
      id: 'technician-1',
      name: 'Diego Pérez',
      email: 'diego@example.test',
      availability: 'BUSY',
      currentTicket: {
        id: 'ticket-1',
        asset: 'Compresor C-12',
        description: 'Falla de presión',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
      },
    },
  ],
  page: 1,
  limit: 10,
  total: 11,
  totalPages: 2,
};

describe('AdminDashboardPageComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function setup() {
    const fixture = TestBed.createComponent(AdminDashboardPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function flushTechnicians(
    payload: PaginatedTechniciansResponse = techniciansResponse,
  ) {
    const request = TestBed.inject(HttpTestingController).expectOne(
      (candidate) => candidate.url === `${API_BASE_URL}/technicians`,
    );
    expect(request.request.params.get('page')).toBe(String(payload.page));
    expect(request.request.params.get('limit')).toBe('10');
    request.flush(payload);
  }

  it('loads only backend aggregates and renders every metric with its meaning', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain('Cargando indicadores');
    const request = TestBed.inject(HttpTestingController).expectOne(
      `${API_BASE_URL}/dashboard/admin`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush(response);
    flushTechnicians();
    fixture.detectChanges();
    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('article'),
    ) as HTMLElement[];
    expect(
      cards.map((card) => card.querySelector('p')?.textContent?.trim()),
    ).toEqual(['301', '21', '7', '12', '5', '20', '3', '4', '9']);
    const capacity = Array.from(
      fixture.nativeElement.querySelectorAll('dd'),
    ) as HTMLElement[];
    expect(capacity.map((item) => item.textContent?.trim())).toEqual([
      '40',
      '28',
      '12',
    ]);
    expect(fixture.nativeElement.textContent).toContain(
      'Excluye resueltos y cerrados',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Datos de demostración',
    );
    expect(
      fixture.nativeElement.querySelector('a[href="/congelamientos"]'),
    ).not.toBeNull();
    expect(
      cards.slice(0, 5).map((card) => card.getAttribute('data-tone')),
    ).toEqual(['primary', 'secondary', 'destructive', 'accent', 'muted']);
    expect(
      fixture.nativeElement.querySelectorAll('.kpi-card ng-icon').length,
    ).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Diego Pérez');
    expect(fixture.nativeElement.textContent).toContain('Compresor C-12');

    const text = fixture.nativeElement.textContent as string;
    expect(text.indexOf('Requiere atención')).toBeLessThan(
      text.indexOf('Capacidad del equipo'),
    );
  });

  it('shows zero counts as real data and explains the empty system', () => {
    const fixture = setup();
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_BASE_URL}/dashboard/admin`)
      .flush({
        tickets: { total: 0, new: 0, critical: 0, inProgress: 0, frozen: 0 },
        technicians: { total: 0, available: 0, busy: 0 },
        requiresAttention: {
          pendingAssignment: 0,
          pendingFreezeApproval: 0,
          pendingReassignment: 0,
          pendingClosure: 0,
        },
      });
    flushTechnicians({ items: [], page: 1, limit: 10, total: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Todavía no hay tickets registrados',
    );
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(9);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('clears stale counts on a failed refresh and supports retry without duplicate requests', () => {
    const fixture = setup();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API_BASE_URL}/dashboard/admin`).flush(response);
    flushTechnicians();
    fixture.componentInstance.load();
    fixture.componentInstance.load();
    http
      .expectOne(`${API_BASE_URL}/dashboard/admin`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(0);
    const retry = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find(
      (button) =>
        (button as HTMLButtonElement).textContent?.trim() === 'Reintentar',
    ) as HTMLButtonElement;
    retry.click();
    http.expectOne(`${API_BASE_URL}/dashboard/admin`).flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(9);
  });

  it('pagina la tabla de técnicos usando el endpoint paginado', () => {
    const fixture = setup();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API_BASE_URL}/dashboard/admin`).flush(response);
    flushTechnicians();
    fixture.detectChanges();

    const next = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Siguiente',
    ) as HTMLButtonElement;
    next.click();
    flushTechnicians({ ...techniciansResponse, page: 2, totalPages: 2 });
    fixture.detectChanges();

    expect(fixture.componentInstance.techniciansPage()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
  });
});
