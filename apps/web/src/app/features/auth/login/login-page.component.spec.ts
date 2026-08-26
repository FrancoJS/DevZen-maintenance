import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { PreviewSessionService } from '../../../core/preview-session.service';

describe('LoginPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    localStorage.removeItem('devzen-preview-role');
    localStorage.removeItem('devzen-mock-session');
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
      'no son correctos'
    );
  });

  it('stores the demo user and redirects after valid credentials', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      email: 'diego.perez@devzen.test',
      password: 'Tecnico123!',
    });

    fixture.componentInstance.submit();

    expect(TestBed.inject(PreviewSessionService).role()).toBe('TECHNICIAN');
    expect(navigateByUrl).toHaveBeenCalledWith('/inicio');
  });
});
