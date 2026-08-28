import { TestBed } from '@angular/core/testing';
import { TicketEvidence } from '../../../core/tickets/ticket.models';
import { TicketEvidenceGalleryComponent } from './ticket-evidence-gallery.component';

const evidence: TicketEvidence = {
  id: 'evidence-id',
  publicId: 'tickets/ticket-id/final/evidence-id',
  mimeType: 'image/jpeg',
  size: 1536000,
  originalFilename: 'reparacion-final.jpg',
  createdAt: '2026-08-28T12:00:00.000Z',
  technician: { id: 'technician-id', name: 'Diego Pérez' },
  accessUrl: 'https://example.test/evidence.jpg',
};

describe('TicketEvidenceGalleryComponent', () => {
  async function createComponent(items: TicketEvidence[]) {
    await TestBed.configureTestingModule({
      imports: [TicketEvidenceGalleryComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(TicketEvidenceGalleryComponent);
    fixture.componentRef.setInput('evidence', items);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the authorized image, metadata, and protected full-size links', async () => {
    const fixture = await createComponent([evidence]);
    const image = fixture.nativeElement.querySelector(
      'img',
    ) as HTMLImageElement;
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    expect(image.src).toBe(evidence.accessUrl);
    expect(image.alt).toBe('Evidencia final: reparacion-final.jpg');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
    }
    expect(fixture.nativeElement.textContent).toContain('Diego Pérez');
    expect(fixture.nativeElement.textContent).toContain('1.5 MiB');
  });

  it('shows an unavailable state when the signed URL is absent', async () => {
    const fixture = await createComponent([{ ...evidence, accessUrl: null }]);

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'La imagen no está disponible',
    );
  });

  it('shows the configured empty state without rendering image requests', async () => {
    const fixture = await createComponent([]);
    fixture.componentRef.setInput(
      'emptyMessage',
      'Este ticket todavía no tiene evidencia.',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Este ticket todavía no tiene evidencia.',
    );
  });

  it('replaces a failed image instead of leaving a broken preview', async () => {
    const fixture = await createComponent([evidence]);
    const image = fixture.nativeElement.querySelector(
      'img',
    ) as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'renovar su enlace temporal',
    );
  });
});
