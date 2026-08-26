import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';
import { PreviewSessionService } from './preview-session.service';

describe('roleGuard', () => {
  it('redirects a requester away from an admin route', async () => {
    localStorage.removeItem('devzen-preview-role');
    localStorage.removeItem('devzen-mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    TestBed.inject(PreviewSessionService).login('camila.rojas@devzen.test', 'Solicitante123!');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tecnicos');

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  it('redirects a technician away from the global maintenance history', async () => {
    localStorage.removeItem('devzen-preview-role');
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    TestBed.inject(PreviewSessionService).setRole('TECHNICIAN');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/historial-global');

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });
});
