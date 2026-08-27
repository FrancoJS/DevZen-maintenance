import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { PreviewSessionService } from '../../../core/preview-session.service';
import { AuthApiService } from '../../../core/auth/auth-api.service';

describe('LoginPageComponent', () => {
  const authApi = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    authApi.login.mockReturnValue(throwError(() => new Error('Invalid credentials')));
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([]), { provide: AuthApiService, useValue: authApi }],
    }).compileComponents();
    localStorage.removeItem('devzen-mock-session');
    localStorage.removeItem('devzen-access-token');
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
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.componentInstance.form.setValue({
      email: 'ana.gonzalez@devzen.test',
      password: 'incorrecta',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'no son correctas'
    );
  });

  it('stores the authenticated API user and redirects after valid credentials', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authApi.login.mockReturnValue(
      of({
        accessToken: 'access-token',
        user: {
          id: 'matias-vega-id',
          name: 'Matías Vega',
          email: 'administrador@luxnova.demo',
          role: 'ADMIN' as const,
        },
      }),
    );
    fixture.componentInstance.form.setValue({
      email: 'administrador@luxnova.demo',
      password: 'SeedPassword123!',
    });

    fixture.componentInstance.submit();

    expect(TestBed.inject(PreviewSessionService).user().name).toBe('Matías Vega');
    expect(TestBed.inject(PreviewSessionService).role()).toBe('ADMIN');
    expect(navigateByUrl).toHaveBeenCalledWith('/inicio');
  });
});
