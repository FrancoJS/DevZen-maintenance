import { Component, Input, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { TicketEvidence } from '../../../core/tickets/ticket.models';

@Component({
  selector: 'app-ticket-evidence-gallery',
  imports: [HlmButtonImports],
  templateUrl: './ticket-evidence-gallery.component.html',
})
export class TicketEvidenceGalleryComponent {
  @Input({ required: true }) evidence: TicketEvidence[] = [];
  @Input() emptyMessage = 'No hay evidencia final disponible.';

  private readonly failedAccessUrls = signal<ReadonlySet<string>>(new Set());

  imageUrl(evidence: TicketEvidence): string | null {
    const accessUrl = evidence.accessUrl;
    return accessUrl && !this.failedAccessUrls().has(accessUrl)
      ? accessUrl
      : null;
  }

  markImageUnavailable(accessUrl: string): void {
    this.failedAccessUrls.update((current) => {
      const updated = new Set(current);
      updated.add(accessUrl);
      return updated;
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KiB`;
    }
    return `${(size / 1024 / 1024).toFixed(1)} MiB`;
  }
}
