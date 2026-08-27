import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { toast } from '@spartan-ng/brain/sonner';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  CreateTicketRequest,
  EquipmentStopped,
  ProductionImpact,
  TicketDetail,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';

const requiredBooleanResponse = (control: AbstractControl): ValidationErrors | null =>
  control.value === null || control.value === undefined ? { required: true } : null;

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

@Component({
  selector: 'app-create-ticket-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
  ],
  providers: [HttpTicketGateway, { provide: TICKET_GATEWAY, useExisting: HttpTicketGateway }],
  templateUrl: './create-ticket-page.component.html',
  styleUrl: './create-ticket-page.component.css',
})
export class CreateTicketPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ticketGateway = inject<TicketGateway>(TICKET_GATEWAY);

  readonly isSubmitting = signal(false);
  readonly createdTicket = signal<TicketDetail | null>(null);
  readonly createdTicketRequest = signal<CreateTicketRequest | null>(null);
  readonly isDetailOpen = signal(false);
  readonly isDetailClosing = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly showValidationErrors = signal(false);

  readonly form = this.formBuilder.group({
    description: this.formBuilder.control('', [Validators.required, Validators.maxLength(1000)]),
    location: this.formBuilder.control('', [Validators.required, Validators.maxLength(200)]),
    asset: this.formBuilder.control('', [Validators.required, Validators.maxLength(200)]),
    impactAssessment: this.formBuilder.group({
      safetyRisk: this.formBuilder.control<boolean | null>(null, [requiredBooleanResponse]),
      equipmentStopped: this.formBuilder.control<EquipmentStopped | null>(null, [Validators.required]),
      productionImpact: this.formBuilder.control<ProductionImpact | null>(null, [Validators.required]),
      workaroundAvailable: this.formBuilder.control<boolean | null>(null, [requiredBooleanResponse]),
      affectsOtherAreas: this.formBuilder.control<boolean | null>(null, [requiredBooleanResponse]),
    }),
  });

  submit(): void {
    if (this.createdTicket() || this.isSubmitting()) {
      return;
    }

    this.createdTicket.set(null);
    this.submitError.set(null);
    this.showValidationErrors.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const request = this.toRequest();

    this.ticketGateway
      .createTicket(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (ticket) => {
          this.createdTicket.set(ticket);
          this.createdTicketRequest.set(request);
          this.isDetailOpen.set(false);
          this.isDetailClosing.set(false);
          this.form.disable({ emitEvent: false });
          toast.success('Solicitud creada', {
            description: `El ticket ${ticket.id} fue registrado correctamente.`,
            action: { label: 'Descartar', onClick: () => undefined },
            duration: 8000,
            class: 'border-primary! bg-card! text-card-foreground! shadow-lg!',
            actionButtonStyle: 'background-color: var(--primary); color: var(--primary-foreground);',
          });
        },
        error: () =>
          this.submitError.set(
            'No fue posible crear la solicitud. Revisa tus datos e inténtalo nuevamente.'
          ),
      });
  }

  openTicketDetail(): void {
    if (this.createdTicket()) {
      this.isDetailClosing.set(false);
      this.isDetailOpen.set(true);
    }
  }

  closeTicketDetail(): void {
    if (!this.isDetailOpen() || this.isDetailClosing()) {
      return;
    }

    this.isDetailClosing.set(true);
    setTimeout(() => {
      this.isDetailOpen.set(false);
      this.isDetailClosing.set(false);
    }, 220);
  }

  startNewTicket(): void {
    this.isDetailOpen.set(false);
    this.isDetailClosing.set(false);
    this.createdTicket.set(null);
    this.createdTicketRequest.set(null);
    this.submitError.set(null);
    this.showValidationErrors.set(false);
    this.form.enable({ emitEvent: false });
    this.form.reset({
      description: '',
      location: '',
      asset: '',
      impactAssessment: {
        safetyRisk: null,
        equipmentStopped: null,
        productionImpact: null,
        workaroundAvailable: null,
        affectsOtherAreas: null,
      },
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  hasError(controlName: 'description' | 'location' | 'asset'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && this.showValidationErrors();
  }

  hasImpactError(
    controlName:
      | 'safetyRisk'
      | 'equipmentStopped'
      | 'productionImpact'
      | 'workaroundAvailable'
      | 'affectsOtherAreas'
  ): boolean {
    const control = this.form.controls.impactAssessment.controls[controlName];
    return control.invalid && this.showValidationErrors();
  }

  priorityLabel(ticket: TicketDetail): string {
    return PRIORITY_LABELS[ticket.priority];
  }

  statusLabel(ticket: TicketDetail): string {
    return STATUS_LABELS[ticket.status];
  }

  equipmentStoppedLabel(value: EquipmentStopped): string {
    return EQUIPMENT_STOPPED_LABELS[value];
  }

  productionImpactLabel(value: ProductionImpact): string {
    return PRODUCTION_IMPACT_LABELS[value];
  }

  priorityClass(priority: TicketDetail['priority']): string {
    const classes: Record<TicketDetail['priority'], string> = {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    };
    return classes[priority];
  }

  formatCreatedAt(createdAt: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(createdAt));
  }

  private toRequest(): CreateTicketRequest {
    const value = this.form.getRawValue();
    const impact = value.impactAssessment;

    return {
      description: value.description ?? '',
      location: value.location ?? '',
      asset: value.asset ?? '',
      impactAssessment: {
        safetyRisk: impact.safetyRisk as boolean,
        equipmentStopped: impact.equipmentStopped as EquipmentStopped,
        productionImpact: impact.productionImpact as ProductionImpact,
        workaroundAvailable: impact.workaroundAvailable as boolean,
        affectsOtherAreas: impact.affectsOtherAreas as boolean,
      },
    };
  }
}
