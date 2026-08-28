import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import {
  ADMIN_FREEZE_GATEWAY,
  AdminFreezeGateway,
} from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  FreezeReasonType,
  FreezeRequestListItem,
  Technician,
  TicketDetail,
  TicketPriority,
  TicketStatus,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';

const FREEZE_REASON_LABELS: Record<FreezeReasonType, string> = {
  SPARE_PART_UNAVAILABLE: 'Falta de repuesto',
  AWAITING_AUTHORIZATION: 'Esperando autorización',
  SPECIALIST_UNAVAILABLE: 'Falta de personal especializado',
  EQUIPMENT_OR_AREA_UNAVAILABLE: 'Equipo o área no disponible',
  OTHER: 'Otro',
};

@Component({
  selector: 'app-admin-freeze-management-page',
  imports: [HlmBadgeImports, HlmButtonImports, HlmCardImports, HlmSheetImports],
  providers: [
    HttpTicketGateway,
    { provide: ADMIN_FREEZE_GATEWAY, useExisting: HttpTicketGateway },
  ],
  templateUrl: './admin-freeze-management-page.component.html',
  styleUrl: './admin-freeze-management-page.component.css',
})
export class AdminFreezeManagementPageComponent implements OnInit {
  private readonly gateway = inject<AdminFreezeGateway>(ADMIN_FREEZE_GATEWAY);

  readonly freezeRequests = signal<FreezeRequestListItem[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadedOnce = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly technicians = signal<Technician[]>([]);
  readonly isTechniciansLoading = signal(true);
  readonly techniciansError = signal<string | null>(null);
  readonly reviewNotes = signal<Record<string, string>>({});
  readonly selectedTechnicianIds = signal<Record<string, string>>({});
  readonly processingRequestId = signal<string | null>(null);
  readonly actionErrors = signal<Record<string, string>>({});
  readonly successMessage = signal<string | null>(null);
  readonly selectedRequest = signal<FreezeRequestListItem | null>(null);
  readonly availableTechnicians = computed(() =>
    this.technicians().filter(({ availability }) => availability === 'AVAILABLE'),
  );
  readonly actionableRequests = computed(() =>
    this.freezeRequests().filter((request) =>
      (request.status === 'PENDING' &&
        request.ticket.status === 'FREEZE_REQUESTED') ||
      (request.status === 'APPROVED' &&
        (request.ticket.status === 'FROZEN' ||
          request.ticket.status === 'PENDING_REASSIGNMENT')),
    ),
  );

  ngOnInit(): void {
    this.loadData();
    this.loadTechnicians();
  }

  loadTechnicians(): void {
    this.isTechniciansLoading.set(true);
    this.techniciansError.set(null);
    this.gateway
      .listTechnicians()
      .pipe(finalize(() => this.isTechniciansLoading.set(false)))
      .subscribe({
        next: ({ items }) => this.technicians.set(items),
        error: () => {
          this.technicians.set([]);
          this.techniciansError.set(
            'No fue posible cargar la disponibilidad de los técnicos.',
          );
        },
      });
  }

  reviewNote(requestId: string): string {
    return this.reviewNotes()[requestId] ?? '';
  }

  updateReviewNote(requestId: string, value: string): void {
    this.reviewNotes.update((notes) => ({ ...notes, [requestId]: value }));
    this.clearActionError(requestId);
  }

  openRequest(request: FreezeRequestListItem): void {
    this.selectedRequest.set(request);
    this.clearActionError(request.id);
  }

  closeRequest(): void {
    this.selectedRequest.set(null);
  }

  onSheetStateChange(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeRequest();
  }

  selectedTechnicianId(requestId: string): string {
    return this.selectedTechnicianIds()[requestId] ?? '';
  }

  updateSelectedTechnician(requestId: string, technicianId: string): void {
    this.selectedTechnicianIds.update((selected) => ({
      ...selected,
      [requestId]: technicianId,
    }));
    this.clearActionError(requestId);
  }

  isProcessing(requestId: string): boolean {
    return this.processingRequestId() === requestId;
  }

  actionError(requestId: string): string | null {
    return this.actionErrors()[requestId] ?? null;
  }

  approve(request: FreezeRequestListItem): void {
    if (!this.beginAction(request.id)) return;

    this.gateway
      .approveFreezeRequest(request.ticket.id, request.id, {
        reviewNote: this.reviewNote(request.id).trim() || null,
      })
      .pipe(finalize(() => this.finishAction()))
      .subscribe({
        next: (ticket) => {
          this.updateRequest(request.id, ticket, 'APPROVED');
          this.successMessage.set('El congelamiento fue aprobado y el técnico quedó disponible.');
        },
        error: (error: HttpErrorResponse) =>
          this.setActionError(request.id, this.actionErrorMessage(error)),
      });
  }

  reject(request: FreezeRequestListItem): void {
    const reviewNote = this.reviewNote(request.id).trim();
    if (!reviewNote) {
      this.setActionError(request.id, 'Indica el motivo del rechazo.');
      return;
    }
    if (!this.beginAction(request.id)) return;

    this.gateway
      .rejectFreezeRequest(request.ticket.id, request.id, { reviewNote })
      .pipe(finalize(() => this.finishAction()))
      .subscribe({
        next: (ticket) => {
          this.updateRequest(request.id, ticket, 'REJECTED');
          this.closeRequest();
          this.successMessage.set('El congelamiento fue rechazado; el técnico mantiene su asignación.');
        },
        error: (error: HttpErrorResponse) =>
          this.setActionError(request.id, this.actionErrorMessage(error)),
      });
  }

  resolveBlocker(request: FreezeRequestListItem): void {
    if (!this.beginAction(request.id)) return;

    this.gateway
      .resolveBlocker(request.ticket.id)
      .pipe(finalize(() => this.finishAction()))
      .subscribe({
        next: (ticket) => {
          this.updateRequest(request.id, ticket);
          this.successMessage.set('El bloqueo fue resuelto. Ahora puedes reasignar un técnico disponible.');
          this.loadTechnicians();
        },
        error: (error: HttpErrorResponse) =>
          this.setActionError(request.id, this.actionErrorMessage(error)),
      });
  }

  assignTechnician(request: FreezeRequestListItem): void {
    const technicianId = this.selectedTechnicianId(request.id);
    const technician = this.technicians().find(({ id }) => id === technicianId);
    if (!technician || technician.availability !== 'AVAILABLE') {
      this.setActionError(request.id, 'Selecciona un técnico disponible.');
      return;
    }
    if (!this.beginAction(request.id)) return;

    this.gateway
      .assignTechnician(request.ticket.id, technician.id)
      .pipe(finalize(() => this.finishAction()))
      .subscribe({
        next: (ticket) => {
          this.updateRequest(request.id, ticket);
          this.closeRequest();
          this.successMessage.set(`${technician.name} fue reasignado correctamente.`);
          this.loadTechnicians();
        },
        error: (error: HttpErrorResponse) =>
          this.setActionError(request.id, this.actionErrorMessage(error)),
      });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.gateway
      .listFreezeRequests()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ items }) => {
          this.freezeRequests.set(items);
          this.hasLoadedOnce.set(true);
        },
        error: () => {
          this.freezeRequests.set([]);
          this.hasLoadedOnce.set(true);
          this.loadError.set(
            'No fue posible cargar los congelamientos pendientes de gestión.',
          );
        },
      });
  }

  reasonLabel(reason: FreezeReasonType): string {
    return FREEZE_REASON_LABELS[reason];
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  statusClass(status: TicketStatus): string {
    return {
      NEW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      ASSIGNED: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200',
      IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      FREEZE_REQUESTED: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
      FROZEN: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
      PENDING_REASSIGNMENT: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
      CLOSED: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    }[status];
  }

  priorityClass(priority: TicketPriority): string {
    return {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    }[priority];
  }

  private beginAction(requestId: string): boolean {
    if (this.processingRequestId()) return false;
    this.processingRequestId.set(requestId);
    this.clearActionError(requestId);
    this.successMessage.set(null);
    return true;
  }

  private finishAction(): void {
    this.processingRequestId.set(null);
  }

  private updateRequest(
    requestId: string,
    ticket: TicketDetail,
    status?: FreezeRequestListItem['status'],
  ): void {
    let updatedRequest: FreezeRequestListItem | null = null;
    this.freezeRequests.update((requests) =>
      requests.map((request) => {
        const nextRequest =
          request.id === requestId
            ? {
                ...request,
                ...(status ? { status } : {}),
                ticket: {
                  ...request.ticket,
                  description: ticket.description,
                  asset: ticket.asset,
                  priority: ticket.priority,
                  status: ticket.status,
                },
              }
            : request;
        if (nextRequest.id === requestId) updatedRequest = nextRequest;
        return nextRequest;
      }),
    );
    if (this.selectedRequest()?.id === requestId) {
      this.selectedRequest.set(updatedRequest);
    }
  }

  private clearActionError(requestId: string): void {
    this.actionErrors.update((errors) => {
      const { [requestId]: _removed, ...remaining } = errors;
      return remaining;
    });
  }

  private setActionError(requestId: string, message: string): void {
    this.actionErrors.update((errors) => ({ ...errors, [requestId]: message }));
  }

  private actionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) return 'La información ingresada no es válida.';
    if (error.status === 404) return 'El ticket o la solicitud ya no está disponible.';
    if (error.status === 409) {
      return 'No se pudo completar la acción: el ticket cambió de estado o el técnico ya está ocupado.';
    }
    return 'No fue posible completar la acción. Inténtalo nuevamente.';
  }
}
