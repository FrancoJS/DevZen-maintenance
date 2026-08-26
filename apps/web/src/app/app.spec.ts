import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { appRoutes } from './app.routes';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { AppShellComponent } from './layout/app-shell.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(appRoutes)],
    }).compileComponents();
  });

  it('should render the application router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should show the maintenance landing page at /inicio', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    expect(harness.routeNativeElement?.textContent).toContain(
      'Resumen de actividad y próximos pasos.'
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'Datos de demostración'
    );
  });

  it('should show login without the application shell', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login', LoginPageComponent);

    expect(harness.routeNativeElement?.querySelector('aside')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });
});
