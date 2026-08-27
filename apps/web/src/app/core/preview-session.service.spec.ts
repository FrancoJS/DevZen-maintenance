import { TestBed } from '@angular/core/testing';
import { PreviewSessionService } from './preview-session.service';
import { ACCESS_TOKEN_STORAGE_KEY } from './api.config';

describe('PreviewSessionService', () => {
  beforeEach(() => {
    localStorage.removeItem('devzen-preview-role');
    localStorage.removeItem('devzen-mock-session');
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [PreviewSessionService] });
  });

  it('starts as ADMIN and persists role changes', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.role()).toBe('ADMIN');
    service.setRole('REQUESTER');

    expect(service.role()).toBe('REQUESTER');
    expect(localStorage.getItem('devzen-preview-role')).toBe('REQUESTER');
    expect(service.user().roleLabel).toBe('Solicitante');
  });

  it('authenticates a demo user and stores the active session without the password', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.login('ana.gonzalez@devzen.test', 'Admin123!')).toBe(true);
    expect(service.role()).toBe('ADMIN');
    expect(service.user().name).toBe('Ana González');
    expect(localStorage.getItem('devzen-mock-session')).toBe(
      JSON.stringify({ email: 'ana.gonzalez@devzen.test', role: 'ADMIN' })
    );
    expect(localStorage.getItem('devzen-mock-session')).not.toContain('Admin123!');
  });

  it('rejects invalid demo credentials', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.login('ana.gonzalez@devzen.test', 'incorrecta')).toBe(false);
    expect(localStorage.getItem('devzen-mock-session')).toBeNull();
  });

  it('clears the active session on logout', () => {
    const service = TestBed.inject(PreviewSessionService);
    service.loginFromApi(
      'ana.gonzalez@devzen.test',
      'ADMIN',
      'token-de-prueba',
    );

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBe('ADMIN');
    expect(localStorage.getItem('devzen-mock-session')).toBeNull();
    expect(localStorage.getItem('devzen-preview-role')).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
