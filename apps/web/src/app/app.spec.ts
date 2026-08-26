import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { appRoutes } from './app.routes';
import { HomePage } from './features/home/home-page';

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
    await harness.navigateByUrl('/inicio', HomePage);

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de gestión de mantenimiento'
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'Interfaz en construcción'
    );
  });
});
