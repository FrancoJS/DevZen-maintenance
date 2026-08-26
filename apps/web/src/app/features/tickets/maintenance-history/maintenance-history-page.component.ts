import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { TicketPriority, TicketStatus, UserRole } from '../../../core/tickets/ticket.models';
import { PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from '../../../shared/tickets/ticket-labels';
import { MAINTENANCE_HISTORY_RECORDS, PREVIEW_TECHNICIAN_ID } from './maintenance-history.data';
import {
  MaintenanceHistoryAction,
  MaintenanceHistoryFilters,
  MaintenanceHistoryRecord,
  MaintenanceHistoryScope,
} from './maintenance-history.models';

const INITIAL_FILTERS: MaintenanceHistoryFilters = {
  query: '',
  status: '',
  priority: '',
  technicianId: '',
};

const ACTION_LABELS: Record<MaintenanceHistoryAction, string> = {
  CREATED: 'Solicitud creada',
  PRIORITY_CALCULATED: 'Prioridad calculada',
  ASSIGNED: 'Técnico asignado',
  STARTED: 'Mantención iniciada',
  FREEZE_REQUESTED: 'Congelamiento solicitado',
  FREEZE_APPROVED: 'Congelamiento aprobado',
  BLOCKER_RESOLVED: 'Bloqueo resuelto',
  REASSIGNED: 'Técnico reasignado',
  RESOLVED: 'Mantención resuelta',
  CLOSED: 'Ticket cerrado',
};

@Component({
  selector: 'app-maintenance-history-page',
  imports: [
    FormsModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmSheetImports,
  ],
  templateUrl: './maintenance-history-page.component.html',
  styleUrl: './maintenance-history-page.component.css',
})
export class MaintenanceHistoryPageComponent {
  private readonly route = inject(ActivatedRoute);

  @ViewChild('detailSheet', { read: ElementRef }) private readonly detailSheet?: ElementRef<HTMLElement>;

  readonly scope = (this.route.snapshot.data['historyScope'] as MaintenanceHistoryScope | undefined) ?? 'personal';
  readonly filters = signal<MaintenanceHistoryFilters>({ ...INITIAL_FILTERS });
  readonly selectedRecord = signal<MaintenanceHistoryRecord | null>(null);
  readonly isGlobal = this.scope === 'global';
  readonly title = this.isGlobal ? 'Historial global de mantenciones' : 'Historial de mantenciones';
  readonly description = this.isGlobal
    ? 'Consulta los trabajos finalizados, sus responsables y la trazabilidad de cada ticket.'
    : 'Consulta las mantenciones finalizadas en las que participaste.';

  readonly technicianOptions = computed(() => {
    const technicians = new Map<string, string>();
    MAINTENANCE_HISTORY_RECORDS.forEach((record) =>
      record.participants.forEach((participant) => technicians.set(participant.id, participant.name))
    );
    return Array.from(technicians, ([id, name]) => ({ id, name })).sort((first, second) =>
      first.name.localeCompare(second.name, 'es')
    );
  });

  readonly records = computed(() => {
    const filters = this.filters();
    const normalizedQuery = filters.query.trim().toLocaleLowerCase('es-CL');

    return MAINTENANCE_HISTORY_RECORDS
      .filter((record) => this.isGlobal || record.participants.some((participant) => participant.id === PREVIEW_TECHNICIAN_ID))
      .filter((record) => !normalizedQuery || `${record.ticketId} ${record.asset}`.toLocaleLowerCase('es-CL').includes(normalizedQuery))
      .filter((record) => !filters.status || record.status === filters.status)
      .filter((record) => !filters.priority || record.priority === filters.priority)
      .filter((record) => !this.isGlobal || !filters.technicianId || record.participants.some((participant) => participant.id === filters.technicianId))
      .sort((first, second) => this.activityDate(second).localeCompare(this.activityDate(first)));
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    return Boolean(filters.query || filters.status || filters.priority || filters.technicianId);
  });

  updateQuery(query: string): void {
    this.filters.update((filters) => ({ ...filters, query }));
  }

  updateStatus(status: MaintenanceHistoryFilters['status']): void {
    this.filters.update((filters) => ({ ...filters, status }));
  }

  updatePriority(priority: MaintenanceHistoryFilters['priority']): void {
    this.filters.update((filters) => ({ ...filters, priority }));
  }

  updateTechnician(technicianId: string): void {
    this.filters.update((filters) => ({ ...filters, technicianId }));
  }

  clearFilters(): void {
    this.filters.set({ ...INITIAL_FILTERS });
  }

  openRecord(record: MaintenanceHistoryRecord): void {
    this.selectedRecord.set(record);
    setTimeout(() => {
      if (this.detailSheet) {
        this.detailSheet.nativeElement.scrollTop = 0;
      }
    });
  }

  closeRecord(): void {
    this.selectedRecord.set(null);
  }

  onSheetStateChange(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeRecord();
    }
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  actionLabel(action: MaintenanceHistoryAction): string {
    return ACTION_LABELS[action];
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  }

  activityDate(record: MaintenanceHistoryRecord): string {
    return record.closedAt ?? record.resolvedAt;
  }

  activityLabel(record: MaintenanceHistoryRecord): string {
    return record.closedAt ? 'Cerrada' : 'Resuelta';
  }

  participantsLabel(record: MaintenanceHistoryRecord): string {
    return record.participants.map((participant) => participant.name).join(', ');
  }

  priorityClass(priority: TicketPriority): string {
    return {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    }[priority];
  }

  statusClass(status: MaintenanceHistoryRecord['status']): string {
    return status === 'CLOSED'
      ? 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
  }
}
