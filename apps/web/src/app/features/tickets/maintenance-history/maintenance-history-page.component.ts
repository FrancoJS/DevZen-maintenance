import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  ADMIN_TICKET_HISTORY_GATEWAY,
  AdminTicketHistoryGateway,
} from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  AssignmentReleaseReason,
  EquipmentStopped,
  FreezeReasonType,
  FreezeRequestStatus,
  ProductionImpact,
  TicketDetail,
  TicketHistoryAction,
  TicketHistoryEntry,
  TicketPriority,
  TicketStatus,
} from '../../../core/tickets/ticket.models';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../../shared/tickets/ticket-labels';
import { TicketEvidenceGalleryComponent } from '../ticket-evidence-gallery/ticket-evidence-gallery.component';

interface MaintenanceHistoryFilters {
  query: string;
  priority: TicketPriority | '';
  technicianId: string;
}

const INITIAL_FILTERS: MaintenanceHistoryFilters = {
  query: '',
  priority: '',
  technicianId: '',
};

const ACTION_LABELS: Record<TicketHistoryAction, string> = {
  TICKET_CREATED: 'Solicitud creada',
  TICKET_UPDATED: 'Solicitud actualizada',
  PRIORITY_CALCULATED: 'Prioridad calculada',
  PRIORITY_OVERRIDDEN: 'Prioridad corregida',
  TECHNICIAN_ASSIGNED: 'Técnico asignado',
  MAINTENANCE_STARTED: 'Mantención iniciada',
  MAINTENANCE_UPDATED: 'Mantención actualizada',
  FREEZE_REQUESTED: 'Congelamiento solicitado',
  FREEZE_APPROVED: 'Congelamiento aprobado',
  FREEZE_REJECTED: 'Congelamiento rechazado',
  BLOCKER_RESOLVED: 'Bloqueo resuelto',
  TICKET_RESOLVED: 'Mantención resuelta',
  TICKET_CLOSED: 'Ticket cerrado',
};

const EQUIPMENT_STOPPED_LABELS: Record<EquipmentStopped, string> = {
  YES: 'Sí, completamente',
  PARTIAL: 'Parcialmente',
  NO: 'No',
};

const PRODUCTION_IMPACT_LABELS: Record<ProductionImpact, string> = {
  STOPPED: 'Producción detenida',
  REDUCED: 'Producción reducida',
  NONE: 'Sin impacto productivo',
};

const FREEZE_REASON_LABELS: Record<FreezeReasonType, string> = {
  SPARE_PART_UNAVAILABLE: 'Falta de repuesto',
  AWAITING_AUTHORIZATION: 'Esperando autorización',
  SPECIALIST_UNAVAILABLE: 'Falta de personal especializado',
  EQUIPMENT_OR_AREA_UNAVAILABLE: 'Equipo o área no disponible',
  OTHER: 'Otro motivo',
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
  selector: 'app-maintenance-history-page',
  imports: [
    FormsModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmSheetImports,
    HlmSkeletonImports,
    HlmTableImports,
    TicketEvidenceGalleryComponent,
  ],
  providers: [
    HttpTicketGateway,
    {
      provide: ADMIN_TICKET_HISTORY_GATEWAY,
      useExisting: HttpTicketGateway,
    },
  ],
  templateUrl: './maintenance-history-page.component.html',
  styleUrl: './maintenance-history-page.component.css',
})
export class MaintenanceHistoryPageComponent implements OnInit {
  private readonly gateway = inject<AdminTicketHistoryGateway>(
    ADMIN_TICKET_HISTORY_GATEWAY
  );

  @ViewChild('detailSheet', { read: ElementRef })
  private readonly detailSheet?: ElementRef<HTMLElement>;

  readonly filters = signal<MaintenanceHistoryFilters>({ ...INITIAL_FILTERS });
  readonly tickets = signal<TicketDetail[]>([]);
  readonly total = signal(0);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly selectedTicket = signal<TicketDetail | null>(null);
  readonly title = 'Historial global de mantenciones';
  readonly description =
    'Consulta los tickets cerrados, sus responsables y la trazabilidad de cada mantención.';

  readonly technicianOptions = computed(() => {
    const technicians = new Map<string, string>();
    this.tickets().forEach((ticket) =>
      ticket.assignments.forEach((assignment) =>
        technicians.set(assignment.technician.id, assignment.technician.name)
      )
    );
    return Array.from(technicians, ([id, name]) => ({ id, name }));
  });

  readonly records = computed(() => {
    const filters = this.filters();
    const normalizedQuery = filters.query.trim().toLocaleLowerCase('es-CL');

    return this.tickets()
      .filter(
        (ticket) =>
          !normalizedQuery ||
          `${this.ticketLabel(ticket)} ${ticket.asset} ${ticket.location}`
            .toLocaleLowerCase('es-CL')
            .includes(normalizedQuery)
      )
      .filter(
        (ticket) => !filters.priority || ticket.priority === filters.priority
      )
      .filter(
        (ticket) =>
          !filters.technicianId ||
          ticket.assignments.some(
            (assignment) => assignment.technician.id === filters.technicianId
          )
      );
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    return Boolean(filters.query || filters.priority || filters.technicianId);
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.gateway
      .listGlobalClosedHistory()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ items, total }) => {
          this.tickets.set(items);
          this.total.set(total);
        },
        error: (error: HttpErrorResponse) => {
          this.tickets.set([]);
          this.total.set(0);
          this.loadError.set(this.loadErrorMessage(error));
        },
      });
  }

  updateQuery(query: string): void {
    this.filters.update((filters) => ({ ...filters, query }));
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

  openTicket(ticket: TicketDetail): void {
    this.selectedTicket.set(ticket);
    setTimeout(() => this.detailSheet?.nativeElement.scrollTo({ top: 0 }));
  }

  closeTicket(): void {
    this.selectedTicket.set(null);
  }

  onSheetStateChange(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeTicket();
  }

  ticketLabel(ticket: TicketDetail): string {
    return ticket.ticketCode ?? ticket.id;
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  actionLabel(action: TicketHistoryAction): string {
    return ACTION_LABELS[action];
  }

  historyDetail(entry: TicketHistoryEntry): string | null {
    if (!entry.details) return null;
    if (typeof entry.details['note'] === 'string') return entry.details['note'];
    if (entry.details['workPerformedRecorded']) {
      return 'Trabajo realizado registrado.';
    }
    if (entry.details['changes']) {
      return 'Se actualizaron datos de la mantención.';
    }
    if (entry.details['technicianId']) {
      return 'Se registró una nueva asignación técnica.';
    }
    if (Array.isArray(entry.details['changedFields'])) {
      return 'Se actualizaron datos de la solicitud.';
    }
    return 'Información adicional registrada.';
  }

  formatDate(date: string | null): string {
    if (!date) return 'Sin registro';
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  activityDate(ticket: TicketDetail): string {
    return ticket.closedAt ?? ticket.resolvedAt ?? ticket.updatedAt;
  }

  participantsLabel(ticket: TicketDetail): string {
    return ticket.assignments.length
      ? ticket.assignments.map((assignment) => assignment.technician.name).join(', ')
      : 'Sin técnicos registrados';
  }

  booleanLabel(value: boolean): string {
    return value ? 'Sí' : 'No';
  }

  equipmentStoppedLabel(value: EquipmentStopped): string {
    return EQUIPMENT_STOPPED_LABELS[value];
  }

  productionImpactLabel(value: ProductionImpact): string {
    return PRODUCTION_IMPACT_LABELS[value];
  }

  freezeReasonLabel(reason: FreezeReasonType): string {
    return FREEZE_REASON_LABELS[reason];
  }

  freezeStatusLabel(status: FreezeRequestStatus): string {
    return FREEZE_STATUS_LABELS[status];
  }

  releaseReasonLabel(reason: AssignmentReleaseReason | null): string {
    return reason ? RELEASE_REASON_LABELS[reason] : 'Sin motivo registrado';
  }

  private loadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Tu sesión no tiene permisos para consultar este historial.';
    }
    return 'No fue posible obtener los tickets cerrados. Inténtalo nuevamente.';
  }
}
