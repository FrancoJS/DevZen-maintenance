import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TECHNICIAN_MAINTENANCE_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  PaginatedTicketsResponse,
  TicketDetail,
  TicketSummary,
} from '../../../core/tickets/ticket.models';
import { TechnicianMaintenanceHistoryPageComponent } from './technician-maintenance-history-page.component';

const summary: TicketSummary = {
  id: '54f1c1b7-2acf-4428-a2f7-58b2943fb044',
  description: 'Pérdida de presión durante la operación.',
  location: 'Planta 2',
  asset: 'Compresor C-12',
  status: 'FROZEN',
  priority: 'HIGH',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  createdAt: '2026-08-24T10:00:00.000Z',
  updatedAt: '2026-08-25T12:00:00.000Z',
};

const detail: TicketDetail = {
  ...summary,
  currentTechnician: null,
  resolvedBy: null,
  resolvedAt: null,
  closedBy: null,
  closedAt: null,
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'PARTIAL',
    productionImpact: 'REDUCED',
    workaroundAvailable: false,
    affectsOtherAreas: false,
    calculatedPriority: 'HIGH',
  },
  assignments: [
    {
      id: 'assignment-id',
      technician: { id: 'technician-id', name: 'Diego Pérez' },
      assignedBy: { id: 'admin-id', name: 'Ana González' },
      assignedAt: '2026-08-24T11:00:00.000Z',
      startedAt: '2026-08-24T11:30:00.000Z',
      releasedAt: '2026-08-25T12:00:00.000Z',
      releaseReason: 'FREEZE_APPROVED',
    },
  ],
  freezeRequests: [
    {
      id: 'freeze-id',
      technician: { id: 'technician-id', name: 'Diego Pérez' },
      reasonType: 'SPARE_PART_UNAVAILABLE',
      reasonDetail: null,
      status: 'APPROVED',
      requestedAt: '2026-08-25T10:00:00.000Z',
      reviewedBy: { id: 'admin-id', name: 'Ana González' },
      reviewedAt: '2026-08-25T12:00:00.000Z',
      reviewNote: 'Se aprobó mientras llega el repuesto.',
    },
  ],
  maintenance: {
    diagnosis: 'Válvula de descarga dañada',
    workPerformed: 'Se aisló el equipo.',
    notes: 'Requiere repuesto nuevo.',
  },
  finalEvidence: [
    {
      id: 'evidence-id',
      publicId: 'tickets/ticket-id/final/evidence-id',
      mimeType: 'image/webp',
      size: 8192,
      originalFilename: 'intervencion.webp',
      createdAt: '2026-08-27T13:00:00.000Z',
      technician: { id: 'technician-id', name: 'Diego Pérez' },
      accessUrl: 'https://example.test/technician-evidence.webp',
    },
  ],
  history: [
    {
      id: 'history-id',
      actor: { id: 'technician-id', name: 'Diego Pérez' },
      action: 'FREEZE_REQUESTED',
      previousStatus: 'IN_PROGRESS',
      newStatus: 'FREEZE_REQUESTED',
      previousPriority: null,
      newPriority: null,
      details: null,
      createdAt: '2026-08-25T10:00:00.000Z',
    },
  ],
};

function pageResponse(
  items: TicketSummary[] = [summary],
  page = 1,
  totalPages = 1
): PaginatedTicketsResponse {
  return {
    items,
    page,
    limit: 20,
    total: totalPages > 1 ? 21 : items.length,
    totalPages,
  };
}

describe('TechnicianMaintenanceHistoryPageComponent', () => {
  let gateway: {
    listMaintenanceHistory: ReturnType<typeof vi.fn>;
    getTicket: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listMaintenanceHistory: vi.fn(() => of(pageResponse())),
      getTicket: vi.fn(() => of(detail)),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianMaintenanceHistoryPageComponent],
    })
      .overrideComponent(TechnicianMaintenanceHistoryPageComponent, {
        set: {
          providers: [
            { provide: TECHNICIAN_MAINTENANCE_GATEWAY, useValue: gateway },
          ],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(
      TechnicianMaintenanceHistoryPageComponent
    );
    fixture.detectChanges();
    return fixture;
  }

  it('loads released participations from the real personal-history contract', () => {
    const fixture = createComponent();

    expect(gateway.listMaintenanceHistory).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
    expect(fixture.nativeElement.textContent).toContain('Compresor C-12');
    expect(fixture.nativeElement.textContent).toContain('Congelada');
    expect(fixture.nativeElement.textContent).toContain(
      'estado actual del ticket'
    );
  });

  it('applies approved status and priority filters in the backend', () => {
    const fixture = createComponent();

    fixture.componentInstance.updateStatus('RESOLVED');
    fixture.componentInstance.updatePriority('CRITICAL');

    expect(gateway.listMaintenanceHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'RESOLVED',
      priority: 'CRITICAL',
    });
  });

  it('loads the requested backend page', () => {
    gateway.listMaintenanceHistory.mockReturnValue(
      of(pageResponse([summary], 1, 2))
    );
    const fixture = createComponent();
    gateway.listMaintenanceHistory.mockReturnValue(
      of(pageResponse([summary], 2, 2))
    );

    fixture.componentInstance.goToPage(2);

    expect(gateway.listMaintenanceHistory).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
    });
    expect(fixture.componentInstance.page()).toBe(2);
  });

  it('loads a complete read-only detail for the historical participation', () => {
    const fixture = createComponent();

    fixture.componentInstance.openTicket(summary);
    fixture.detectChanges();

    expect(gateway.getTicket).toHaveBeenCalledWith(summary.id);
    expect(document.body.textContent).toContain(
      'Detalle de participación · Solo lectura'
    );
    expect(document.body.textContent).toContain(
      'Válvula de descarga dañada'
    );
    expect(document.body.textContent).toContain('Diego Pérez');
    expect(document.body.textContent).toContain('Falta de repuesto');
    expect(document.body.textContent).toContain(
      'Congelamiento solicitado'
    );
    expect(document.body.querySelector('img')?.src).toBe(
      'https://example.test/technician-evidence.webp'
    );

    const actionLabels = Array.from(
      document.body.querySelectorAll('button')
    ).map((button) => (button as HTMLButtonElement).textContent?.trim());
    expect(actionLabels).not.toContain('Iniciar mantención');
    expect(actionLabels).not.toContain('Guardar información técnica');
    expect(actionLabels).not.toContain('Solicitar congelamiento');
    expect(actionLabels).not.toContain('Resolver mantención');
  });

  it('shows a recoverable list error', () => {
    gateway.listMaintenanceHistory.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar el historial'
    );
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });

  it('does not expose a hidden historical detail after a 404', () => {
    gateway.getTicket.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
      ) as Observable<TicketDetail>
    );
    const fixture = createComponent();

    fixture.componentInstance.openTicket(summary);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTicket()).toBeNull();
    expect(document.body.textContent).toContain(
      'La mantención ya no está disponible para tu usuario'
    );
  });
});
