import { TestBed } from '@angular/core/testing';
import { PreviewSessionService } from './preview-session.service';

describe('PreviewSessionService', () => {
  beforeEach(() => {
    localStorage.removeItem('devzen-preview-role');
    TestBed.configureTestingModule({ providers: [PreviewSessionService] });
  });

  it('starts as ADMIN and persists role changes', () => {
    const service = TestBed.inject(PreviewSessionService);

    expect(service.role()).toBe('ADMIN');
    service.setRole('REQUESTER');

    expect(service.role()).toBe('REQUESTER');
    expect(localStorage.getItem('devzen-preview-role')).toBe('REQUESTER');
    expect(service.user().roleLabel).toBe('Solicitante');
  });
});
