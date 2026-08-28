import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import {
  TECHNICIAN_MAINTENANCE_GATEWAY,
  TechnicianMaintenanceGateway,
} from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  EquipmentStopped,
  FreezeReasonType,
  ProductionImpact,
  RequestFreezeRequest,
  ResolveMaintenanceRequest,
  TicketDetail,
  TicketHistoryAction,
  TicketMaintenance,
  TicketPriority,
  TicketStatus,
  UpdateMaintenanceRequest,
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
  MAINTENANCE_UPDATED: 'Información técnica actualizada',
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

const FREEZE_REASON_LABELS: Record<FreezeReasonType, string> = {
  SPARE_PART_UNAVAILABLE: 'Falta de repuesto',
  AWAITING_AUTHORIZATION: 'Esperando autorización',
  SPECIALIST_UNAVAILABLE: 'Falta de personal especializado',
  EQUIPMENT_OR_AREA_UNAVAILABLE: 'Equipo o área no disponible',
  OTHER: 'Otro',
};

const ACCEPTED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FINAL_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-current-maintenance-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    TicketEvidenceGalleryComponent,
  ],
  providers: [
    HttpTicketGateway,
    {
      provide: TECHNICIAN_MAINTENANCE_GATEWAY,
      useExisting: HttpTicketGateway,
    },
  ],
  templateUrl: './current-maintenance-page.component.html',
  styleUrl: './current-maintenance-page.component.css',
})
export class CurrentMaintenancePageComponent implements OnInit {
  private readonly gateway = inject<TechnicianMaintenanceGateway>(
    TECHNICIAN_MAINTENANCE_GATEWAY
  );
  private readonly formBuilder = inject(FormBuilder);

  readonly maintenanceForm = this.formBuilder.nonNullable.group({
    diagnosis: [''],
    workPerformed: [''],
    notes: [''],
  });
  readonly freezeForm = new FormGroup({
    reasonType: new FormControl<FreezeReasonType | ''>('', {
      nonNullable: true,
    }),
    reasonDetail: new FormControl('', { nonNullable: true }),
  });
  readonly resolutionForm = new FormGroup({
    workPerformed: new FormControl('', { nonNullable: true }),
  });
  private readonly maintenanceBaseline = signal<TicketMaintenance>({
    diagnosis: null,
    workPerformed: null,
    notes: null,
  });
  private readonly maintenanceFormValue = signal(
    this.maintenanceForm.getRawValue()
  );
  private readonly freezeFormValue = signal(this.freezeForm.getRawValue());
  private readonly resolutionFormValue = signal(
    this.resolutionForm.getRawValue()
  );

  readonly ticket = signal<TicketDetail | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isStarting = signal(false);
  readonly startError = signal<string | null>(null);
  readonly startSuccess = signal<string | null>(null);
  readonly isSavingMaintenance = signal(false);
  readonly maintenanceError = signal<string | null>(null);
  readonly maintenanceSuccess = signal<string | null>(null);
  readonly isRequestingFreeze = signal(false);
  readonly freezeError = signal<string | null>(null);
  readonly freezeSuccess = signal<string | null>(null);
  readonly isResolving = signal(false);
  readonly resolutionError = signal<string | null>(null);
  readonly resolutionSuccess = signal<string | null>(null);
  readonly evidenceFile = signal<File | null>(null);
  readonly isUploadingEvidence = signal(false);
  readonly evidenceError = signal<string | null>(null);
  readonly evidenceSuccess = signal<string | null>(null);
  readonly hasMaintenanceChanges = computed(() => {
    const value = this.maintenanceFormValue();
    const baseline = this.maintenanceBaseline();
    return (
      this.normalizeMaintenanceText(value.diagnosis) !== baseline.diagnosis ||
      this.normalizeMaintenanceText(value.workPerformed) !==
        baseline.workPerformed ||
      this.normalizeMaintenanceText(value.notes) !== baseline.notes
    );
  });
  readonly freezeDetailRequired = computed(
    () => this.freezeFormValue().reasonType === 'OTHER'
  );
  readonly canRequestFreeze = computed(() => {
    const ticket = this.ticket();
    const value = this.freezeFormValue();
    return (
      ticket?.status === 'IN_PROGRESS' &&
      Boolean(value.reasonType) &&
      (!this.freezeDetailRequired() || Boolean(value.reasonDetail.trim()))
    );
  });
  readonly canResolve = computed(
    () =>
      this.ticket()?.status === 'IN_PROGRESS' &&
      Boolean(this.resolutionFormValue().workPerformed.trim())
  );
  readonly canUploadEvidence = computed(
    () =>
      this.ticket()?.status === 'IN_PROGRESS' &&
      Boolean(this.evidenceFile()) &&
      !this.isUploadingEvidence()
  );

  constructor() {
    this.maintenanceForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.maintenanceFormValue.set(this.maintenanceForm.getRawValue())
      );
    this.freezeForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.freezeFormValue.set(this.freezeForm.getRawValue())
      );
    this.resolutionForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.resolutionFormValue.set(this.resolutionForm.getRawValue())
      );
  }

  ngOnInit(): void {
    this.loadCurrentMaintenance();
  }

  loadCurrentMaintenance(clearActionMessages = true): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    if (clearActionMessages) {
      this.startError.set(null);
      this.startSuccess.set(null);
      this.maintenanceError.set(null);
      this.maintenanceSuccess.set(null);
      this.freezeError.set(null);
      this.freezeSuccess.set(null);
      this.resolutionError.set(null);
      this.resolutionSuccess.set(null);
      this.evidenceError.set(null);
      this.evidenceSuccess.set(null);
      this.evidenceFile.set(null);
      this.resetFreezeForm();
    }

    this.gateway
      .getCurrentMaintenance()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ ticket }) => this.applyTicket(ticket),
        error: () => {
          this.applyTicket(null);
          this.loadError.set(
            'No fue posible consultar tu mantención actual. Inténtalo nuevamente.'
          );
        },
      });
  }

  startMaintenance(): void {
    const ticket = this.ticket();
    if (!ticket || ticket.status !== 'ASSIGNED' || this.isStarting()) return;

    this.isStarting.set(true);
    this.startError.set(null);
    this.startSuccess.set(null);
    this.gateway
      .startMaintenance(ticket.id)
      .pipe(finalize(() => this.isStarting.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.applyTicket(updatedTicket);
          this.startSuccess.set('La mantención fue iniciada correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.startError.set(this.startErrorMessage(error));
          if ([403, 404, 409].includes(error.status)) {
            this.loadCurrentMaintenance(false);
          }
        },
      });
  }

  saveMaintenance(): void {
    const ticket = this.ticket();
    if (
      !ticket ||
      ticket.status !== 'IN_PROGRESS' ||
      !this.hasMaintenanceChanges() ||
      this.isSavingMaintenance()
    ) {
      return;
    }

    const request = this.buildMaintenanceRequest();
    if (Object.keys(request).length === 0) return;

    this.isSavingMaintenance.set(true);
    this.maintenanceError.set(null);
    this.maintenanceSuccess.set(null);
    this.gateway
      .updateMaintenance(ticket.id, request)
      .pipe(finalize(() => this.isSavingMaintenance.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.applyTicket(updatedTicket);
          this.maintenanceSuccess.set(
            'La información técnica fue guardada correctamente.'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.maintenanceError.set(this.maintenanceErrorMessage(error));
          if ([403, 404, 409].includes(error.status)) {
            this.loadCurrentMaintenance(false);
          }
        },
      });
  }

  requestFreeze(): void {
    const ticket = this.ticket();
    const value = this.freezeForm.getRawValue();
    if (
      !ticket ||
      ticket.status !== 'IN_PROGRESS' ||
      !this.canRequestFreeze() ||
      this.isRequestingFreeze()
    ) {
      return;
    }

    const request: RequestFreezeRequest = {
      reasonType: value.reasonType as FreezeReasonType,
    };
    if (value.reasonType === 'OTHER') {
      request.reasonDetail = value.reasonDetail.trim();
    }

    this.isRequestingFreeze.set(true);
    this.freezeError.set(null);
    this.freezeSuccess.set(null);
    this.gateway
      .requestFreeze(ticket.id, request)
      .pipe(finalize(() => this.isRequestingFreeze.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.applyTicket(updatedTicket);
          this.resetFreezeForm();
          this.freezeSuccess.set(
            'La solicitud de congelamiento fue enviada correctamente.'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.freezeError.set(this.freezeErrorMessage(error));
          if ([403, 404, 409].includes(error.status)) {
            this.loadCurrentMaintenance(false);
          }
        },
      });
  }

  resolveMaintenance(): void {
    const ticket = this.ticket();
    const workPerformed =
      this.resolutionForm.getRawValue().workPerformed.trim();
    if (
      !ticket ||
      ticket.status !== 'IN_PROGRESS' ||
      !workPerformed ||
      this.isResolving()
    ) {
      return;
    }

    const request: ResolveMaintenanceRequest = { workPerformed };
    this.isResolving.set(true);
    this.resolutionError.set(null);
    this.resolutionSuccess.set(null);
    this.gateway
      .resolveMaintenance(ticket.id, request)
      .pipe(finalize(() => this.isResolving.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.applyTicket(updatedTicket);
          this.resolutionSuccess.set(
            'La mantención fue resuelta y tu asignación quedó liberada.'
          );
          this.loadCurrentMaintenance(false);
        },
        error: (error: HttpErrorResponse) => {
          this.resolutionError.set(this.resolutionErrorMessage(error));
          if ([403, 404, 409].includes(error.status)) {
            this.loadCurrentMaintenance(false);
          }
        },
      });
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.evidenceError.set(null);
    this.evidenceSuccess.set(null);

    if (!file) {
      this.evidenceFile.set(null);
      return;
    }
    if (!ACCEPTED_EVIDENCE_TYPES.includes(file.type)) {
      this.evidenceFile.set(null);
      input.value = '';
      this.evidenceError.set('Selecciona una imagen JPEG, PNG o WebP.');
      return;
    }
    if (file.size > FINAL_EVIDENCE_MAX_BYTES) {
      this.evidenceFile.set(null);
      input.value = '';
      this.evidenceError.set('La evidencia no puede superar los 5 MiB.');
      return;
    }

    this.evidenceFile.set(file);
  }

  uploadFinalEvidence(input: HTMLInputElement): void {
    const ticket = this.ticket();
    const file = this.evidenceFile();
    if (
      !ticket ||
      ticket.status !== 'IN_PROGRESS' ||
      !file ||
      this.isUploadingEvidence()
    ) {
      return;
    }

    const pendingResolutionWork = this.resolutionForm.getRawValue().workPerformed;
    this.isUploadingEvidence.set(true);
    this.evidenceError.set(null);
    this.evidenceSuccess.set(null);
    this.gateway
      .uploadFinalEvidence(ticket.id, file)
      .pipe(finalize(() => this.isUploadingEvidence.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.applyTicket(updatedTicket);
          this.resolutionForm.controls.workPerformed.setValue(
            pendingResolutionWork,
            { emitEvent: false }
          );
          this.resolutionFormValue.set(this.resolutionForm.getRawValue());
          this.evidenceFile.set(null);
          input.value = '';
          this.evidenceSuccess.set('La evidencia final fue cargada correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.evidenceError.set(this.evidenceErrorMessage(error));
          if ([403, 404, 409].includes(error.status)) {
            this.loadCurrentMaintenance(false);
          }
        },
      });
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

  booleanLabel(value: boolean): string {
    return value ? 'Sí' : 'No';
  }

  equipmentStoppedLabel(value: EquipmentStopped): string {
    return EQUIPMENT_STOPPED_LABELS[value];
  }

  productionImpactLabel(value: ProductionImpact): string {
    return PRODUCTION_IMPACT_LABELS[value];
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatFileSize(size: number): string {
    return `${(size / 1024 / 1024).toFixed(1)} MiB`;
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

  private applyTicket(ticket: TicketDetail | null): void {
    this.ticket.set(ticket);
    const maintenance = ticket?.maintenance ?? {
      diagnosis: null,
      workPerformed: null,
      notes: null,
    };
    const baseline: TicketMaintenance = {
      diagnosis: this.normalizeMaintenanceText(maintenance.diagnosis),
      workPerformed: this.normalizeMaintenanceText(maintenance.workPerformed),
      notes: this.normalizeMaintenanceText(maintenance.notes),
    };
    this.maintenanceBaseline.set(baseline);
    this.maintenanceForm.reset(
      {
        diagnosis: baseline.diagnosis ?? '',
        workPerformed: baseline.workPerformed ?? '',
        notes: baseline.notes ?? '',
      },
      { emitEvent: false }
    );
    this.maintenanceFormValue.set(this.maintenanceForm.getRawValue());
    this.resolutionForm.reset(
      { workPerformed: baseline.workPerformed ?? '' },
      { emitEvent: false }
    );
    this.resolutionFormValue.set(this.resolutionForm.getRawValue());
  }

  private buildMaintenanceRequest(): UpdateMaintenanceRequest {
    const value = this.maintenanceForm.getRawValue();
    const baseline = this.maintenanceBaseline();
    const request: UpdateMaintenanceRequest = {};
    const diagnosis = this.normalizeMaintenanceText(value.diagnosis);
    const workPerformed = this.normalizeMaintenanceText(value.workPerformed);
    const notes = this.normalizeMaintenanceText(value.notes);

    if (diagnosis !== baseline.diagnosis) request.diagnosis = diagnosis;
    if (workPerformed !== baseline.workPerformed) {
      request.workPerformed = workPerformed;
    }
    if (notes !== baseline.notes) request.notes = notes;
    return request;
  }

  private normalizeMaintenanceText(value: string | null): string | null {
    return value?.trim() || null;
  }

  private resetFreezeForm(): void {
    this.freezeForm.reset(
      { reasonType: '', reasonDetail: '' },
      { emitEvent: false }
    );
    this.freezeFormValue.set(this.freezeForm.getRawValue());
  }

  private freezeErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Selecciona un motivo válido y completa el detalle requerido.';
    }
    if (error.status === 403) {
      return 'Ya no eres el técnico asignado a esta mantención.';
    }
    if (error.status === 404) {
      return 'La mantención ya no está disponible.';
    }
    if (error.status === 409) {
      return 'La mantención cambió de estado y no pudo congelarse.';
    }
    return 'No fue posible solicitar el congelamiento. Inténtalo nuevamente.';
  }

  private resolutionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Registra el trabajo realizado antes de resolver la mantención.';
    }
    if (error.status === 403) {
      return 'Ya no eres el técnico asignado a esta mantención.';
    }
    if (error.status === 404) {
      return 'La mantención ya no está disponible.';
    }
    if (error.status === 409) {
      return 'La mantención cambió de estado o no tiene evidencia final de tu asignación actual.';
    }
    return 'No fue posible resolver la mantención. Inténtalo nuevamente.';
  }

  private evidenceErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'La evidencia debe ser una imagen JPEG, PNG o WebP de hasta 5 MiB.';
    }
    if (error.status === 403) {
      return 'Ya no eres el técnico asignado a esta mantención.';
    }
    if (error.status === 404) {
      return 'La mantención ya no está disponible.';
    }
    if (error.status === 409) {
      return 'La mantención cambió de estado y no admite nueva evidencia.';
    }
    return 'No fue posible cargar la evidencia final. Inténtalo nuevamente.';
  }

  private maintenanceErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'No se enviaron cambios técnicos válidos.';
    }
    if (error.status === 403) {
      return 'Ya no eres el técnico asignado a esta mantención.';
    }
    if (error.status === 404) {
      return 'La mantención ya no está disponible.';
    }
    if (error.status === 409) {
      return 'La mantención cambió de estado y no pudo actualizarse.';
    }
    return 'No fue posible guardar la información técnica. Inténtalo nuevamente.';
  }

  private startErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Ya no eres el técnico asignado a esta mantención.';
    }
    if (error.status === 404) {
      return 'La mantención ya no está disponible.';
    }
    if (error.status === 409) {
      return 'La mantención cambió de estado y no pudo iniciarse.';
    }
    return 'No fue posible iniciar la mantención. Inténtalo nuevamente.';
  }
}
