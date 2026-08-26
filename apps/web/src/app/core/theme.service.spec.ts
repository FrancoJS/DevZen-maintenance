import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('devzen-theme');
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({ providers: [ThemeService] });
  });

  it('persists and applies the selected theme', () => {
    const service = TestBed.inject(ThemeService);

    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('devzen-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
