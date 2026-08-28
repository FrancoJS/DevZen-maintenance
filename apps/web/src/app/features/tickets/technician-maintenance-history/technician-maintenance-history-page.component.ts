import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  MaintenanceHistoryFilters,
  TECHNICIAN_MAINTENANCE_GATEWAY,
  TechnicianMaintenanceGateway,
} from '../../../core/tickets/ticket.gateway';
import {
  AssignmentReleaseReason,
  FreezeReasonType,
  FreezeRequestStatus,
  TicketDetail,
  TicketHistoryAction,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';

const PAGE_SIZE = 20;

const HISTORY_ACTION_LABELS: Record<TicketHistoryAction, string> = {
  TICKET_CREATED: 'Ticket creado',
  TICKET_UPDATED: 'Solicitud actualizada',
  PRIORITY_CALCULATED: 'Prioridad calculada',
  PRIORITY_OVERRIDDEN: 'Prioridad corregida',
  TECHNICIAN_ASSIGNED: 'Técnico asignado',
  MAINTENANCE_STARTED: 'Mantención iniciada',
  MAINTENANCE_UPDATED: 'Información técnica actualizada',
  FREEZE_REQUESTED: 'Congelamiento solicitado',
  FREEZE_APPROVED: 'Congelamiento aprobado',
  FREEZE_REJECTED: 'Congelamiento rechazado',
  BLOCKER_RESOLVED: 'Bloqueo resuelto',
  TICKET_RESOLVED: 'Mantención resuelta',
  TICKET_CLOSED: 'Ticket cerrado',
};

const FREEZE_REASON_LABELS: Record<FreezeReasonType, string> = {
  SPARE_PART_UNAVAILABLE: 'Falta de repuesto',
  AWAITING_AUTHORIZATION: 'Esperando autorización',
  SPECIALIST_UNAVAILABLE: 'Falta de personal especializado',
  EQUIPMENT_OR_AREA_UNAVAILABLE: 'Equipo o área no disponible',
  OTHER: 'Otro',
};

const FREEZE_STATUS_LABELS: Record<FreezeRequestStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const RELEASE_REASON_LABELS: Record<AssignmentReleaseReason, string> = {
  FREEZE_APPROVED: 'Congelamiento aprobado',
  RESOLVED: 'Mantención resuelta',
};

@Component({
  selector: 'app-technician-maintenance-history-page',
  imports: [
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSheetImports,
    HlmTableImports,
  ],
  providers: [
    HttpTicketGateway,
    {
      provide: TECHNICIAN_MAINTENANCE_GATEWAY,
      useExisting: HttpTicketGateway,
    },
  ],
  templateUrl: './technician-maintenance-history-page.component.html',
  styleUrl: './technician-maintenance-history-page.component.css',
})
export class TechnicianMaintenanceHistoryPageComponent implements OnInit {
  private readonly gateway = inject<TechnicianMaintenanceGateway>(
    TECHNICIAN_MAINTENANCE_GATEWAY
  );

  readonly tickets = signal<TicketSummary[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly total = signal(0);
  readonly statusFilter = signal<TicketStatus | ''>('');
  readonly priorityFilter = signal<TicketPriority | ''>('');
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly selectedTicketId = signal<string | null>(null);
  readonly selectedTicket = signal<TicketDetail | null>(null);
  readonly isDetailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.gateway
      .listMaintenanceHistory(this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.tickets.set(response.items);
          this.page.set(response.page);
          this.totalPages.set(response.totalPages);
          this.total.set(response.total);
        },
        error: () => {
          this.tickets.set([]);
          this.totalPages.set(0);
          this.total.set(0);
          this.loadError.set(
            'No fue posible cargar tu historial de mantenciones.'
          );
        },
      });
  }

  updateStatus(status: string): void {
    this.statusFilter.set(status as TicketStatus | '');
    this.page.set(1);
    this.loadHistory();
  }

  updatePriority(priority: string): void {
    this.priorityFilter.set(priority as TicketPriority | '');
    this.page.set(1);
    this.loadHistory();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.page.set(1);
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.page() ||
      this.isLoading()
    ) {
      return;
    }
    this.page.set(page);
    this.loadHistory();
  }

  openTicket(ticket: TicketSummary): void {
    this.selectedTicketId.set(ticket.id);
    this.selectedTicket.set(null);
    this.detailError.set(null);
    this.isDetailLoading.set(true);
    this.gateway
      .getTicket(ticket.id)
      .pipe(finalize(() => this.isDetailLoading.set(false)))
      .subscribe({
        next: (detail) => this.selectedTicket.set(detail),
        error: (error: HttpErrorResponse) => {
          this.detailError.set(
            error.status === 404
              ? 'La mantención ya no está disponible para tu usuario.'
              : 'No fue posible cargar el detalle de la mantención.'
          );
        },
      });
  }

  retryDetail(): void {
    const ticket = this.tickets().find(
      ({ id }) => id === this.selectedTicketId()
    );
    if (ticket) this.openTicket(ticket);
  }

  closeDetail(): void {
    this.selectedTicketId.set(null);
    this.selectedTicket.set(null);
    this.detailError.set(null);
  }

  onSheetStateChange(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeDetail();
  }

  hasFilters(): boolean {
    return Boolean(this.statusFilter() || this.priorityFilter());
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  historyActionLabel(action: TicketHistoryAction): string {
    return HISTORY_ACTION_LABELS[action];
  }

  freezeReasonLabel(reason: FreezeReasonType): string {
    return FREEZE_REASON_LABELS[reason];
  }

  freezeStatusLabel(status: FreezeRequestStatus): string {
    return FREEZE_STATUS_LABELS[status];
  }

  releaseReasonLabel(reason: AssignmentReleaseReason | null): string {
    return reason ? RELEASE_REASON_LABELS[reason] : 'Asignación activa';
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

  private filters(): MaintenanceHistoryFilters {
    const filters: MaintenanceHistoryFilters = {
      page: this.page(),
      limit: PAGE_SIZE,
    };
    if (this.statusFilter()) filters.status = this.statusFilter() as TicketStatus;
    if (this.priorityFilter()) {
      filters.priority = this.priorityFilter() as TicketPriority;
    }
    return filters;
  }
}
