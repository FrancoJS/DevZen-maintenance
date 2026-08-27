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

  it('starts unauthenticated with the default display user', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBe('ADMIN');
  });

  it('stores the complete authenticated API user and derives its display data', () => {
    const service = TestBed.inject(PreviewSessionService);

    service.loginFromApi(
      {
        id: 'matias-vega-id',
        name: 'Matías Vega',
        email: 'administrador@luxnova.demo',
        role: 'ADMIN',
      },
      'access-token',
    );

    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('ADMIN');
    expect(service.user().name).toBe('Matías Vega');
    expect(service.user().initials).toBe('MV');
    expect(service.user().roleLabel).toBe('Administrador');
    expect(localStorage.getItem('devzen-mock-session')).toBe(
      JSON.stringify({
        user: {
          id: 'matias-vega-id',
          name: 'Matías Vega',
          email: 'administrador@luxnova.demo',
          role: 'ADMIN',
        },
      })
    );
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('access-token');
  });

  it('restores the persisted authenticated identity after a page reload', () => {
    localStorage.setItem(
      'devzen-mock-session',
      JSON.stringify({
        user: {
          id: 'matias-vega-id',
          name: 'Matías Vega',
          email: 'administrador@luxnova.demo',
          role: 'ADMIN',
        },
      }),
    );

    const service = TestBed.inject(PreviewSessionService);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user().name).toBe('Matías Vega');
    expect(service.user().initials).toBe('MV');
  });

  it('rejects invalid demo credentials', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.login('ana.gonzalez@devzen.test', 'incorrecta')).toBe(false);
    expect(localStorage.getItem('devzen-mock-session')).toBeNull();
  });

  it('clears the active session on logout', () => {
    const service = TestBed.inject(PreviewSessionService);
    service.loginFromApi(
      {
        id: 'matias-vega-id',
        name: 'Matías Vega',
        email: 'administrador@luxnova.demo',
        role: 'ADMIN',
      },
      'access-token',
    );

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBe('ADMIN');
    expect(localStorage.getItem('devzen-mock-session')).toBeNull();
    expect(localStorage.getItem('devzen-preview-role')).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
