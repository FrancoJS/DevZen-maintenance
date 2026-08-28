import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import {
  ADMIN_TICKET_GATEWAY,
  AdminTicketGateway,
} from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  EquipmentStopped,
  ProductionImpact,
  Technician,
  TicketDetail,
  TicketHistoryAction,
  TicketHistoryEntry,
  TicketPriority,
  TicketStatus,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';
import { TicketEvidenceGalleryComponent } from '../ticket-evidence-gallery/ticket-evidence-gallery.component';

const HISTORY_ACTION_LABELS: Record<TicketHistoryAction, string> = {
  TICKET_CREATED: 'Ticket creado',
  TICKET_UPDATED: 'Solicitud actualizada',
  PRIORITY_CALCULATED: 'Prioridad calculada',
  PRIORITY_OVERRIDDEN: 'Prioridad corregida',
  TECHNICIAN_ASSIGNED: 'Técnico asignado',
  MAINTENANCE_STARTED: 'Mantención iniciada',
  MAINTENANCE_UPDATED: 'Información de la mantención actualizada',
  FREEZE_REQUESTED: 'Congelamiento solicitado',
  FREEZE_APPROVED: 'Congelamiento aprobado',
  FREEZE_REJECTED: 'Congelamiento rechazado',
  BLOCKER_RESOLVED: 'Bloqueo resuelto',
  TICKET_RESOLVED: 'Ticket resuelto',
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

@Component({
  selector: 'app-admin-ticket-detail-page',
  imports: [
    RouterLink,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    TicketEvidenceGalleryComponent,
  ],
  providers: [
    HttpTicketGateway,
    { provide: ADMIN_TICKET_GATEWAY, useExisting: HttpTicketGateway },
  ],
  templateUrl: './admin-ticket-detail-page.component.html',
  styleUrl: './admin-ticket-detail-page.component.css',
})
export class AdminTicketDetailPageComponent implements OnInit {
  private readonly gateway = inject<AdminTicketGateway>(ADMIN_TICKET_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  readonly ticketId = input('');
  readonly embedded = input(false);
  @Output() readonly ticketUpdated = new EventEmitter<void>();
  @Output() readonly ticketClosed = new EventEmitter<string>();

  readonly ticket = signal<TicketDetail | null>(null);
  readonly technicians = signal<Technician[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly selectedTechnicianId = signal('');
  readonly isAssigning = signal(false);
  readonly assignmentError = signal<string | null>(null);
  readonly assignmentSuccess = signal<string | null>(null);
  readonly availabilityWarning = signal<string | null>(null);
  readonly isClosing = signal(false);
  readonly closureError = signal<string | null>(null);

  readonly availableTechnicians = computed(() =>
    this.technicians().filter(({ availability }) => availability === 'AVAILABLE')
  );
  readonly canAssign = computed(() => this.ticket()?.status === 'NEW');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      ticket: this.gateway.getTicket(
        this.ticketId() || this.route.snapshot.paramMap.get('id') || ''
      ),
      technicians: this.gateway.listTechnicians(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ ticket, technicians }) => {
          this.ticket.set(ticket);
          this.technicians.set(technicians.items);
        },
        error: (error: HttpErrorResponse) => {
          this.ticket.set(null);
          this.technicians.set([]);
          this.loadError.set(
            error.status === 404
              ? 'El ticket no existe o no está disponible para tu usuario.'
              : 'No fue posible cargar el detalle del ticket.'
          );
        },
      });
  }

  updateTechnician(technicianId: string): void {
    this.selectedTechnicianId.set(technicianId);
    this.assignmentError.set(null);
    this.assignmentSuccess.set(null);
  }

  assignTechnician(): void {
    const ticket = this.ticket();
    const technicianId = this.selectedTechnicianId();
    if (!ticket || !this.canAssign() || this.isAssigning()) return;

    if (!technicianId) {
      this.assignmentError.set('Selecciona un técnico disponible.');
      return;
    }

    const technician = this.technicians().find(({ id }) => id === technicianId);
    if (!technician || technician.availability !== 'AVAILABLE') {
      this.assignmentError.set('El técnico seleccionado no está disponible.');
      return;
    }

    this.isAssigning.set(true);
    this.assignmentError.set(null);
    this.assignmentSuccess.set(null);
    this.availabilityWarning.set(null);

    this.gateway
      .assignTechnician(ticket.id, technicianId)
      .pipe(finalize(() => this.isAssigning.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.ticket.set(updatedTicket);
          this.selectedTechnicianId.set('');
          this.assignmentSuccess.set(
            `${technician.name} fue asignado correctamente.`
          );
          this.refreshTechnicians();
          this.ticketUpdated.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.assignmentError.set(this.assignmentErrorMessage(error));
        },
      });
  }

  closeTicket(): void {
    const ticket = this.ticket();
    if (!ticket || ticket.status !== 'RESOLVED' || this.isClosing()) return;

    this.isClosing.set(true);
    this.closureError.set(null);

    this.gateway
      .closeTicket(ticket.id)
      .pipe(finalize(() => this.isClosing.set(false)))
      .subscribe({
        next: (closedTicket) => {
          this.ticket.set(closedTicket);
          this.ticketClosed.emit(ticket.id);
        },
        error: (error: HttpErrorResponse) => {
          this.closureError.set(this.closureErrorMessage(error));
        },
      });
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

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  historyActionLabel(action: TicketHistoryAction): string {
    return HISTORY_ACTION_LABELS[action];
  }

  historyDetail(entry: TicketHistoryEntry): string | null {
    if (!entry.details) return null;
    if (typeof entry.details['note'] === 'string') return entry.details['note'];
    if (entry.details['workPerformedRecorded']) return 'Trabajo realizado registrado.';
    if (entry.details['changes']) return 'Se actualizaron datos de la mantención.';
    if (entry.details['technicianId']) return 'Se registró una nueva asignación técnica.';
    if (Array.isArray(entry.details['changedFields'])) {
      return 'Se actualizaron datos de la solicitud.';
    }
    return 'Información adicional registrada.';
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

  private refreshTechnicians(): void {
    this.gateway.listTechnicians().subscribe({
      next: ({ items }) => this.technicians.set(items),
      error: () =>
        this.availabilityWarning.set(
          'La asignación se guardó, pero no pudimos actualizar el estado del equipo.'
        ),
    });
  }

  private assignmentErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'El técnico seleccionado no es válido.';
    }
    if (error.status === 404) {
      return 'El ticket o el técnico ya no está disponible.';
    }
    if (error.status === 409) {
      return 'No se pudo asignar: el ticket cambió de estado o el técnico está ocupado.';
    }
    return 'No fue posible asignar el técnico. Inténtalo nuevamente.';
  }

  private closureErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'El ticket ya no está disponible. Actualiza la gestión para continuar.';
    }
    if (error.status === 409) {
      return 'No se pudo cerrar: el ticket ya no está en estado resuelto.';
    }
    return 'No fue posible cerrar el ticket. Inténtalo nuevamente.';
  }
}
