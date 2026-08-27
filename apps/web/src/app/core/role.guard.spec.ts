import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';
import { PreviewSessionService } from './preview-session.service';

describe('roleGuard', () => {
  it('redirects a requester away from an admin route', async () => {
    localStorage.removeItem('devzen-mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    TestBed.inject(PreviewSessionService).login('camila.rojas@devzen.test', 'Solicitante123!');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/gestion-tickets');

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  it('redirects a requester away from the administrative ticket detail', async () => {
    localStorage.removeItem('devzen-mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    TestBed.inject(PreviewSessionService).login('camila.rojas@devzen.test', 'Solicitante123!');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tickets/54f1c1b7-2acf-4428-a2f7-58b2943fb044');

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  it('redirects a technician away from the global maintenance history', async () => {
    localStorage.removeItem('devzen-mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    TestBed.inject(PreviewSessionService).login('diego.perez@devzen.test', 'Tecnico123!');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/historial-global');

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });
});
