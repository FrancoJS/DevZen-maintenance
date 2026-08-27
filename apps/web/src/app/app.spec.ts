import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { appRoutes } from './app.routes';
import { PreviewSessionService } from './core/preview-session.service';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { AppShellComponent } from './layout/app-shell.component';
import { NAVIGATION_GROUPS } from './shared/navigation/navigation.model';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('devzen-preview-role');
    localStorage.removeItem('devzen-mock-session');
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
    TestBed.inject(PreviewSessionService).login('ana.gonzalez@devzen.test', 'Admin123!');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    expect(harness.routeNativeElement?.textContent).toContain(
      'Resumen de actividad y próximos pasos.'
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'Datos de demostración'
    );
  });

  it('should redirect private routes to login without a session', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', LoginPageComponent);

    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('should show login without the application shell', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login', LoginPageComponent);

    expect(harness.routeNativeElement?.querySelector('nav[aria-label="Navegación principal"]')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });

  it('should redirect an authenticated user away from login', async () => {
    TestBed.inject(PreviewSessionService).login('ana.gonzalez@devzen.test', 'Admin123!');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login', AppShellComponent);

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  it('should clear the session and redirect to login on sign out', async () => {
    const session = TestBed.inject(PreviewSessionService);
    session.login('ana.gonzalez@devzen.test', 'Admin123!');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const logoutButton = harness.routeNativeElement?.querySelector(
      'button[aria-label="Cerrar sesión"]'
    ) as HTMLButtonElement;
    logoutButton.click();
    await harness.fixture.whenStable();

    expect(session.isAuthenticated()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('should show the authenticated identity and read-only role in the shell', async () => {
    TestBed.inject(PreviewSessionService).loginFromApi(
      {
        id: 'matias-vega-id',
        name: 'Matías Vega',
        email: 'administrador@luxnova.demo',
        role: 'ADMIN',
      },
      'access-token',
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const shell = harness.routeNativeElement as HTMLElement;
    expect(shell.textContent).toContain('Matías Vega');
    expect(shell.textContent).toContain('Rol');
    expect(shell.textContent).toContain('Administrador');
    expect(shell.textContent).toContain('MV');
    expect(shell.querySelector('select[aria-label="Seleccionar rol demo"]')).toBeNull();
  });

  it('removes the standalone technicians destination from routes and navigation', () => {
    const privateRoutes = appRoutes
      .flatMap((route) => route.children ?? [])
      .map((route) => route.path);
    const navigationRoutes = NAVIGATION_GROUPS.flatMap((group) =>
      group.items.map((item) => item.route)
    );

    expect(privateRoutes).not.toContain('tecnicos');
    expect(navigationRoutes).not.toContain('/tecnicos');
  });

});
