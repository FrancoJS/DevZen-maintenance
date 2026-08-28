import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { CurrentMaintenanceStatusService } from './current-maintenance-status.service';
import { HttpTicketGateway } from './tickets/http-ticket.gateway';

describe('CurrentMaintenanceStatusService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpTicketGateway,
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each(['ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED'])(
    'shares the request and marks an active %s assignment as busy',
    (status) => {
      const service = TestBed.inject(CurrentMaintenanceStatusService);
      service.load().subscribe();
      TestBed.inject(HttpTicketGateway).getCurrentMaintenance().subscribe();
      expect(service.isLoading()).toBe(true);
      expect(service.availability()).toBeNull();
      TestBed.inject(HttpTestingController)
        .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
        .flush({ ticket: { id: 'active', status } });
      expect(service.availability()).toBe('BUSY');
      expect(service.isLoading()).toBe(false);
    },
  );

  it('confirms availability when refreshing after resolution or approved freeze', () => {
    const service = TestBed.inject(CurrentMaintenanceStatusService);
    const gateway = TestBed.inject(HttpTicketGateway);
    const http = TestBed.inject(HttpTestingController);
    service.load().subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: { id: 'active' } });
    gateway.getCurrentMaintenance().subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: null });
    expect(service.availability()).toBe('AVAILABLE');
  });

  it('does not report availability on an API error and permits retry', () => {
    const service = TestBed.inject(CurrentMaintenanceStatusService);
    const http = TestBed.inject(HttpTestingController);
    service.load().subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: null });
    service.load().subscribe({ error: () => undefined });
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.availability()).toBeNull();
    expect(service.isLoading()).toBe(false);
    service.load().subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: null });
    expect(service.availability()).toBe('AVAILABLE');
  });

  it('does not reuse or publish a read started before successful resolution', () => {
    const service = TestBed.inject(CurrentMaintenanceStatusService);
    const gateway = TestBed.inject(HttpTicketGateway);
    const http = TestBed.inject(HttpTestingController);
    service.load().subscribe();
    const oldRead = http.expectOne(`${API_BASE_URL}/tickets/my-maintenance`);
    gateway
      .resolveMaintenance('active', { workPerformed: 'Reparación completada' })
      .subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/active/resolve`)
      .flush({ status: 'RESOLVED' });
    gateway.getCurrentMaintenance().subscribe();
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: null });
    oldRead.flush({ ticket: { id: 'active', status: 'IN_PROGRESS' } });
    expect(service.availability()).toBe('AVAILABLE');
  });
});
