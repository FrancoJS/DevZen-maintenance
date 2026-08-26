import { TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
    }).compileComponents();
  });

  it('renders the login form', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Iniciar sesión');
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
});
