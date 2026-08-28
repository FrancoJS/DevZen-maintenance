import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  CurrentMaintenanceResponse,
  TechnicianAvailability,
} from './tickets/ticket.models';

/** Session-scoped remote status shared by the shell and the current maintenance page. */
@Injectable({ providedIn: 'root' })
export class CurrentMaintenanceStatusService {
  private readonly http = inject(HttpClient);
  private readonly currentAvailability = signal<TechnicianAvailability | null>(
    null,
  );
  private readonly loading = signal(false);
  private pending?: Observable<CurrentMaintenanceResponse>;
  private revision = 0;

  readonly availability = this.currentAvailability.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  invalidate(): void {
    this.revision += 1;
    this.pending = undefined;
    this.currentAvailability.set(null);
    this.loading.set(false);
  }

  load(): Observable<CurrentMaintenanceResponse> {
    if (this.pending) return this.pending;

    this.loading.set(true);
    const revision = this.revision;
    this.pending = this.http
      .get<CurrentMaintenanceResponse>(`${API_BASE_URL}/tickets/my-maintenance`)
      .pipe(
        tap({
          // The endpoint returns only the authenticated technician's active assignment.
          next: ({ ticket }) => {
            if (revision === this.revision)
              this.currentAvailability.set(ticket ? 'BUSY' : 'AVAILABLE');
          },
          error: () => {
            if (revision === this.revision) this.currentAvailability.set(null);
          },
        }),
        finalize(() => {
          if (revision === this.revision) {
            this.pending = undefined;
            this.loading.set(false);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    return this.pending;
  }
}
