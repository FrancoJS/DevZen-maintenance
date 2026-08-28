import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_TOKEN_STORAGE_KEY } from '../../../core/api.config';
import {
  AuthApiService,
  LoginResponse,
} from '../../../core/auth/auth-api.service';
import { PreviewSessionService } from '../../../core/preview-session.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let authApi: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApi = {
      login: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApi },
      ],
    }).compileComponents();
    localStorage.removeItem('devzen-mock-session');
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  });

  it('renders the login form', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Inicia sesión');
    expect(element.querySelector('input[type="email"]')).not.toBeNull();
    expect(element.querySelector('input[type="password"]')).not.toBeNull();
    expect(
      element.querySelector('button[type="submit"]')?.textContent,
    ).toContain('Iniciar sesión');
    expect(element.textContent).not.toContain('Cuentas de demostración');
    expect(element.textContent).not.toContain('Contraseña:');
    expect(element.querySelector('app-footer')).not.toBeNull();
  });

  it('shows required errors after submitting an empty form', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').requestSubmit();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('.field-error');
    expect(errors).toHaveLength(2);
    expect(errors[0].textContent).toContain('obligatorio');
    expect(errors[1].textContent).toContain('obligatoria');
  });

  it('shows an error for invalid credentials', () => {
    authApi.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.componentInstance.form.setValue({
      email: 'ana.gonzalez@devzen.test',
      password: 'incorrecta',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('no son correctos');
  });

  it('stores the authenticated API user and redirects after valid credentials', () => {
    authApi.login.mockReturnValue(
      of({
        accessToken: 'access-token',
        user: {
          id: 'matias-vega-id',
          name: 'Matías Vega',
          email: 'administrador@luxnova.demo',
          role: 'ADMIN',
        },
      } satisfies LoginResponse),
    );
    const fixture = TestBed.createComponent(LoginPageComponent);
    const router = TestBed.inject(Router);
    const navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      email: 'administrador@luxnova.demo',
      password: 'SeedPassword123!',
    });

    fixture.componentInstance.submit();

    const session = TestBed.inject(PreviewSessionService);
    expect(session.user().name).toBe('Matías Vega');
    expect(session.role()).toBe('ADMIN');
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('access-token');
    expect(navigateByUrl).toHaveBeenCalledWith('/inicio');
  });
});
