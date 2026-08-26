import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { MockTicketGateway } from '../../../core/tickets/mock-ticket.gateway';
import {
  CreateTicketRequest,
  CreatedTicket,
  EquipmentStopped,
  ProductionImpact,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';

@Component({
  selector: 'app-create-ticket-page',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [MockTicketGateway, { provide: TICKET_GATEWAY, useExisting: MockTicketGateway }],
  templateUrl: './create-ticket-page.component.html',
  styleUrl: './create-ticket-page.component.css',
})
export class CreateTicketPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ticketGateway = inject<TicketGateway>(TICKET_GATEWAY);

  readonly isSubmitting = signal(false);
  readonly createdTicket = signal<CreatedTicket | null>(null);
  readonly submitError = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    description: this.formBuilder.control('', [Validators.required, Validators.maxLength(1000)]),
    area: this.formBuilder.control('', [Validators.required]),
    location: this.formBuilder.control('', [Validators.required]),
    asset: this.formBuilder.control('', [Validators.required]),
    impactAssessment: this.formBuilder.group({
      safetyRisk: this.formBuilder.control<boolean | null>(null, [Validators.required]),
      equipmentStopped: this.formBuilder.control<EquipmentStopped | null>(null, [Validators.required]),
      productionImpact: this.formBuilder.control<ProductionImpact | null>(null, [Validators.required]),
      workaroundAvailable: this.formBuilder.control<boolean | null>(null, [Validators.required]),
      affectsOtherAreas: this.formBuilder.control<boolean | null>(null, [Validators.required]),
    }),
  });

  submit(): void {
    this.createdTicket.set(null);
    this.submitError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.ticketGateway
      .createTicket(this.toRequest())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: ({ ticket }) => this.createdTicket.set(ticket),
        error: () =>
          this.submitError.set(
            'No fue posible crear la solicitud. Revisa tus datos e inténtalo nuevamente.'
          ),
      });
  }

  hasError(controlName: 'description' | 'area' | 'location' | 'asset'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
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
    return control.invalid && control.touched;
  }

  priorityLabel(ticket: CreatedTicket): string {
    return PRIORITY_LABELS[ticket.priority];
  }

  statusLabel(ticket: CreatedTicket): string {
    return STATUS_LABELS[ticket.status];
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
      area: value.area ?? '',
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
