import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { TicketDetail } from '../../../core/tickets/ticket.models';
import { TicketDetailModalComponent } from './ticket-detail-modal.component';

const ticket: TicketDetail = {
  id: 'ticket-id',
  description: 'La bomba no inicia.',
  location: 'Planta 2',
  asset: 'Bomba B-02',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  status: 'NEW',
  priority: 'HIGH',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'YES',
    productionImpact: 'NONE',
    workaroundAvailable: true,
    affectsOtherAreas: false,
    calculatedPriority: 'HIGH',
  },
  currentTechnician: null,
  resolvedBy: null,
  resolvedAt: null,
  closedBy: null,
  closedAt: null,
  assignments: [],
  maintenance: null,
  history: [
    {
      id: 'history-id',
      actor: { id: 'requester-id', name: 'Camila Rojas' },
      action: 'TICKET_CREATED',
      previousStatus: null,
      newStatus: 'NEW',
      previousPriority: null,
      newPriority: 'HIGH',
      details: { source: 'Formulario web' },
      createdAt: '2026-08-27T10:00:00.000Z',
    },
  ],
};

describe('TicketDetailModalComponent', () => {
  it('muestra la solicitud, impacto e historial recibido del backend', async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetailModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(TicketDetailModalComponent);
    fixture.componentInstance.ticket = ticket;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La bomba no inicia.');
    expect(fixture.nativeElement.textContent).toContain('Sí, se detiene completamente');
    expect(fixture.nativeElement.textContent).toContain('Solicitud creada');
    expect(fixture.nativeElement.textContent).toContain('source: Formulario web');
  });

  it('emite el cierre desde el botón del modal', async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetailModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(TicketDetailModalComponent);
    const closed = vi.fn();
    fixture.componentInstance.ticket = ticket;
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button[aria-label="Cerrar detalle del ticket"]') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
