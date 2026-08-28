import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from './core/api.config';
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
      providers: [provideRouter(appRoutes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should render the application router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should show the maintenance landing page at /inicio', async () => {
    TestBed.inject(PreviewSessionService).login(
      'ana.gonzalez@devzen.test',
      'Admin123!',
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    expect(harness.routeNativeElement?.textContent).toContain(
      'Estado de los tickets, capacidad del equipo y tareas pendientes.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain(
      'Datos de demostración',
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

    expect(
      harness.routeNativeElement?.querySelector(
        'nav[aria-label="Navegación principal"]',
      ),
    ).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });

  it('should redirect an authenticated user away from login', async () => {
    TestBed.inject(PreviewSessionService).login(
      'ana.gonzalez@devzen.test',
      'Admin123!',
    );
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
      'button[aria-label="Cerrar sesión"]',
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
    expect(shell.textContent).toContain('Administrador');
    expect(shell.textContent).toContain('MV');
    expect(
      shell.querySelector('select[aria-label="Seleccionar rol demo"]'),
    ).toBeNull();
  });

  it('places the user profile above navigation and keeps sign out as a sidebar option', async () => {
    TestBed.inject(PreviewSessionService).login(
      'ana.gonzalez@devzen.test',
      'Admin123!',
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const sidebar = harness.routeNativeElement?.querySelector(
      'aside',
    ) as HTMLElement;
    const profile = sidebar.querySelector('[aria-label="Perfil de usuario"]');
    const requestsLink = sidebar.querySelector('a[href="/mis-solicitudes"]');
    const logoutButton = sidebar.querySelector(
      'button[aria-label="Cerrar sesión"]',
    );

    expect(profile).not.toBeNull();
    expect(requestsLink).not.toBeNull();
    expect(logoutButton).not.toBeNull();
    expect(profile!.compareDocumentPosition(requestsLink!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('lands requesters in their requests without a dashboard or maintenance link', async () => {
    TestBed.inject(PreviewSessionService).login('camila.rojas@devzen.test', 'Solicitante123!');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio');
    expect(TestBed.inject(Router).url).toBe('/mis-solicitudes');
    const sidebar = harness.routeNativeElement?.querySelector('aside');
    expect(sidebar?.querySelector('a[href="/inicio"]')).toBeNull();
    expect(sidebar?.querySelector('a[href="/mi-mantencion"]')).toBeNull();
    TestBed.inject(HttpTestingController).expectNone(`${API_BASE_URL}/dashboard/admin`);
    TestBed.inject(HttpTestingController).expectNone(`${API_BASE_URL}/tickets/my-maintenance`);
  });

  it('lands technicians in their maintenance and shares availability with the sidebar', async () => {
    TestBed.inject(PreviewSessionService).login('diego.perez@devzen.test', 'Tecnico123!');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio');
    expect(TestBed.inject(Router).url).toBe('/mi-mantencion');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API_BASE_URL}/tickets/my-maintenance`).flush({ ticket: null });
    harness.detectChanges();
    const sidebar = harness.routeNativeElement?.querySelector('aside');
    expect(sidebar?.querySelector('a[href="/inicio"]')).toBeNull();
    expect(sidebar?.querySelector('a[href="/mi-mantencion"]')).not.toBeNull();
    expect(sidebar?.textContent).toContain('Disponible');
    http.expectNone(`${API_BASE_URL}/dashboard/admin`);
  });

  it('removes the standalone technicians destination from routes and navigation', () => {
    const privateRoutes = appRoutes
      .flatMap((route) => route.children ?? [])
      .map((route) => route.path);
    const navigationRoutes = NAVIGATION_GROUPS.flatMap((group) =>
      group.items.map((item) => item.route),
    );

    expect(privateRoutes).not.toContain('tecnicos');
    expect(navigationRoutes).not.toContain('/tecnicos');
  });

  it('protects Mi mantención as a technician-only lazy route', () => {
    const maintenanceRoute = appRoutes
      .flatMap((route) => route.children ?? [])
      .find((route) => route.path === 'mi-mantencion');

    expect(maintenanceRoute?.data?.['roles']).toEqual(['TECHNICIAN']);
    expect(maintenanceRoute?.loadComponent).toBeDefined();
    expect(maintenanceRoute?.component).toBeUndefined();
  });

  it('protects the real maintenance history as a technician-only lazy route', () => {
    const historyRoute = appRoutes
      .flatMap((route) => route.children ?? [])
      .find((route) => route.path === 'historial-mantenciones');

    expect(historyRoute?.data?.['roles']).toEqual(['TECHNICIAN']);
    expect(historyRoute?.data?.['historyScope']).toBeUndefined();
    expect(historyRoute?.loadComponent).toBeDefined();
  });

  it('consolidates request creation into Mis solicitudes', () => {
    const privateRoutes = appRoutes.flatMap((route) => route.children ?? []);
    const navigationRoutes = NAVIGATION_GROUPS.flatMap((group) =>
      group.items.map((item) => item.route),
    );
    const legacyCreateRoute = privateRoutes.find(
      (route) => route.path === 'crear-solicitud',
    );
    const ticketsRoute = privateRoutes.find(
      (route) => route.path === 'tickets',
    );
    const legacyNewRoute = ticketsRoute?.children?.find(
      (route) => route.path === 'new',
    );

    expect(navigationRoutes).not.toContain('/crear-solicitud');
    expect(
      (legacyCreateRoute?.redirectTo as (route: unknown) => string)({}),
    ).toBe('/mis-solicitudes?create=1');
    expect((legacyNewRoute?.redirectTo as (route: unknown) => string)({})).toBe(
      '/mis-solicitudes?create=1',
    );
  });
});
