import { TestBed } from '@angular/core/testing';
import { AppFooterComponent } from './app-footer.component';

describe('AppFooterComponent', () => {
  it('renders the shared product and event identification', () => {
    const fixture = TestBed.createComponent(AppFooterComponent);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('footer')?.textContent,
    ).toContain('DevZen Ops');
    expect(fixture.nativeElement.textContent).toContain(
      'Hackaton LuxNova INACAP 2026',
    );
  });
});
