import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiService, LoginResponse } from '../../../core/auth/auth-api.service';
import { ACCESS_TOKEN_STORAGE_KEY } from '../../../core/api.config';
import { LoginPageComponent } from './login-page.component';
import { PreviewSessionService } from '../../../core/preview-session.service';

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
    localStorage.removeItem('devzen-preview-role');
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
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Iniciar sesión');
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

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'no son correctos'
    );
  });

  it('stores the demo user and redirects after valid credentials', () => {
    authApi.login.mockReturnValue(
      of({
        accessToken: 'token-de-prueba',
        user: {
          id: 'technician-id',
          name: 'Diego Pérez',
          email: 'diego.perez@devzen.test',
          role: 'TECHNICIAN',
        },
      } satisfies LoginResponse),
    );
    const fixture = TestBed.createComponent(LoginPageComponent);
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      email: 'diego.perez@devzen.test',
      password: 'Tecnico123!',
    });

    fixture.componentInstance.submit();

    expect(TestBed.inject(PreviewSessionService).role()).toBe('TECHNICIAN');
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
      'token-de-prueba',
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/inicio');
  });
});
