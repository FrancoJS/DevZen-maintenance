import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import {
  EquipmentStopped,
  ProductionImpact,
  TicketDetail,
  TicketHistoryAction,
  TicketPriority,
  TicketStatus,
} from '../../../core/tickets/ticket.models';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../../shared/tickets/ticket-labels';
import { TicketEvidenceGalleryComponent } from '../ticket-evidence-gallery/ticket-evidence-gallery.component';

const EQUIPMENT_STOPPED_LABELS: Record<EquipmentStopped, string> = {
  YES: 'Sí, se detiene completamente',
  PARTIAL: 'Parcialmente',
  NO: 'No, continúa funcionando',
};

const PRODUCTION_IMPACT_LABELS: Record<ProductionImpact, string> = {
  STOPPED: 'Detiene la producción',
  REDUCED: 'Reduce la producción',
  NONE: 'No afecta la producción',
};

const HISTORY_ACTION_LABELS: Record<TicketHistoryAction, string> = {
  TICKET_CREATED: 'Solicitud creada',
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

const HISTORY_FIELD_LABELS: Record<string, string> = {
  description: 'la descripción de la solicitud',
  assetId: 'la máquina o equipo',
  impactAssessment: 'la evaluación de impacto',
};

@Component({
  selector: 'app-ticket-detail-modal',
  imports: [
    HlmBadgeImports,
    HlmButtonImports,
    HlmSheetImports,
    TicketEvidenceGalleryComponent,
  ],
  templateUrl: './ticket-detail-modal.component.html',
})
export class TicketDetailModalComponent {
  @Input({ required: true }) ticket!: TicketDetail;
  @Output() readonly closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  onSheetStateChange(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.close();
    }
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  equipmentStoppedLabel(value: EquipmentStopped): string {
    return EQUIPMENT_STOPPED_LABELS[value];
  }

  productionImpactLabel(value: ProductionImpact): string {
    return PRODUCTION_IMPACT_LABELS[value];
  }

  historyActionLabel(action: TicketHistoryAction): string {
    return HISTORY_ACTION_LABELS[action];
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  priorityClass(priority: TicketPriority): string {
    return {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    }[priority];
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

  historyDetails(details: Record<string, unknown> | null): string | null {
    if (!details || Object.keys(details).length === 0) return null;

    const changedFields = details['changedFields'];
    if (Array.isArray(changedFields)) {
      const fields = changedFields
        .filter((field): field is string => typeof field === 'string')
        .map((field) => HISTORY_FIELD_LABELS[field])
        .filter((field): field is string => Boolean(field));

      if (fields.length === 1) return `Se editó ${fields[0]}.`;
      if (fields.length > 1) return `Se editaron ${fields.join(', ')}.`;
      return 'Se editaron datos de la solicitud.';
    }

    const source = details['source'];
    if (typeof source === 'string') {
      return `Solicitud creada desde ${source.toLocaleLowerCase('es-CL')}.`;
    }

    if (details['workPerformedRecorded']) {
      return 'Se registró el trabajo realizado.';
    }

    if (details['changes']) {
      return 'Se actualizó la información de la mantención.';
    }

    return null;
  }
}
