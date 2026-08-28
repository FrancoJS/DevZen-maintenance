import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../core/api.config';
import { PreviewSessionService } from '../core/preview-session.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent availability badge', () => {
  beforeEach(() => {
    localStorage.removeItem('devzen-mock-session');
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(PreviewSessionService).login(
      'diego.perez@devzen.test',
      'Tecnico123!',
    );
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('keeps busy while refreshing and shows the badge next to the technician name', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    expect(fixture.nativeElement.textContent).toContain('Consultando');
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: { status: 'FREEZE_REQUESTED' } });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Disponibilidad: Ocupado"]',
      ),
    ).not.toBeNull();
    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Diego PérezOcupado');
    expect(fixture.nativeElement.textContent).not.toContain('Consultando');
    http
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({ ticket: null });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Disponibilidad: Disponible"]',
      ),
    ).not.toBeNull();
    const collapse = fixture.nativeElement.querySelector(
      'button[aria-label="Colapsar barra lateral"]',
    ) as HTMLButtonElement;
    collapse.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Disponibilidad: Disponible"]',
      )?.textContent,
    ).toBe('Disp.');
  });

  it('shows an unconfirmed status instead of available when the backend is unreachable', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_BASE_URL}/tickets/my-maintenance`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Disponibilidad: Sin confirmar"]',
      ),
    ).not.toBeNull();
  });
});
