import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TECHNICIAN_MAINTENANCE_GATEWAY } from '../../../core/tickets/ticket.gateway';
import {
  CurrentMaintenanceResponse,
  TicketDetail,
} from '../../../core/tickets/ticket.models';
import { CurrentMaintenancePageComponent } from './current-maintenance-page.component';

const assignedTicket: TicketDetail = {
  id: '54f1c1b7-2acf-4428-a2f7-58b2943fb044',
  description: 'El compresor pierde presión durante la operación.',
  location: 'Planta 2',
  asset: 'Compresor C-12',
  status: 'ASSIGNED',
  priority: 'HIGH',
  requester: { id: 'requester-id', name: 'Camila Rojas' },
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:30:00.000Z',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'PARTIAL',
    productionImpact: 'REDUCED',
    workaroundAvailable: false,
    affectsOtherAreas: false,
    calculatedPriority: 'HIGH',
  },
  currentTechnician: { id: 'technician-id', name: 'Diego Pérez' },
  resolvedBy: null,
  resolvedAt: null,
  closedBy: null,
  closedAt: null,
  assignments: [
    {
      id: 'assignment-id',
      technician: { id: 'technician-id', name: 'Diego Pérez' },
      assignedBy: { id: 'admin-id', name: 'Ana González' },
      assignedAt: '2026-08-27T10:30:00.000Z',
      startedAt: null,
      releasedAt: null,
      releaseReason: null,
    },
  ],
  freezeRequests: [],
  maintenance: null,
  finalEvidence: [],
  history: [
    {
      id: 'history-id',
      actor: { id: 'admin-id', name: 'Ana González' },
      action: 'TECHNICIAN_ASSIGNED',
      previousStatus: 'NEW',
      newStatus: 'ASSIGNED',
      previousPriority: null,
      newPriority: null,
      details: { technicianId: 'technician-id' },
      createdAt: '2026-08-27T10:30:00.000Z',
    },
  ],
};

const inProgressTicket: TicketDetail = {
  ...assignedTicket,
  status: 'IN_PROGRESS',
  assignments: [
    {
      ...assignedTicket.assignments[0],
      startedAt: '2026-08-27T11:00:00.000Z',
    },
  ],
  maintenance: {
    diagnosis: 'Pérdida en la válvula de descarga',
    workPerformed: null,
    notes: 'Revisar presión después del ajuste',
  },
};

describe('CurrentMaintenancePageComponent', () => {
  let gateway: {
    getCurrentMaintenance: ReturnType<typeof vi.fn>;
    startMaintenance: ReturnType<typeof vi.fn>;
    updateMaintenance: ReturnType<typeof vi.fn>;
    requestFreeze: ReturnType<typeof vi.fn>;
    resolveMaintenance: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      getCurrentMaintenance: vi.fn(() => of({ ticket: assignedTicket })),
      startMaintenance: vi.fn(),
      updateMaintenance: vi.fn(),
      requestFreeze: vi.fn(),
      resolveMaintenance: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CurrentMaintenancePageComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(CurrentMaintenancePageComponent, {
        set: {
          providers: [
            { provide: TECHNICIAN_MAINTENANCE_GATEWAY, useValue: gateway },
          ],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(CurrentMaintenancePageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the authenticated technician current assignment and its traceability', () => {
    const fixture = createComponent();

    expect(gateway.getCurrentMaintenance).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Compresor C-12');
    expect(fixture.nativeElement.textContent).toContain('Diego Pérez');
    expect(fixture.nativeElement.textContent).toContain('Técnico asignado');
    expect(fixture.nativeElement.textContent).toContain('Disponibilidad: Ocupado');
    expect(fixture.nativeElement.textContent).toContain('Iniciar mantención');
  });

  it('shows an available empty state when the technician has no assignment', () => {
    gateway.getCurrentMaintenance.mockReturnValue(of({ ticket: null }));
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'No tienes una mantención asignada'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Disponibilidad: Disponible'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Iniciar mantención'
    );
  });

  it('starts an ASSIGNED maintenance and replaces the view with backend state', () => {
    gateway.startMaintenance.mockReturnValue(
      of({
        ...assignedTicket,
        status: 'IN_PROGRESS',
        assignments: [
          { ...assignedTicket.assignments[0], startedAt: '2026-08-27T11:00:00.000Z' },
        ],
        maintenance: { diagnosis: null, workPerformed: null, notes: null },
      } satisfies TicketDetail)
    );
    const fixture = createComponent();

    fixture.componentInstance.startMaintenance();
    fixture.detectChanges();

    expect(gateway.startMaintenance).toHaveBeenCalledWith(assignedTicket.id);
    expect(fixture.componentInstance.ticket()?.status).toBe('IN_PROGRESS');
    expect(fixture.nativeElement.textContent).toContain(
      'La mantención fue iniciada correctamente'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Iniciar mantención'
    );
  });

  it.each(['IN_PROGRESS', 'FREEZE_REQUESTED'] as const)(
    'does not offer start outside ASSIGNED (%s)',
    (status) => {
      gateway.getCurrentMaintenance.mockReturnValue(
        of({ ticket: { ...assignedTicket, status } })
      );
      const fixture = createComponent();

      fixture.componentInstance.startMaintenance();

      expect(gateway.startMaintenance).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).not.toContain(
        'Iniciar mantención'
      );
    }
  );

  it('refreshes authoritative state after a concurrent start conflict', () => {
    gateway.startMaintenance.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })
      ) as Observable<TicketDetail>
    );
    gateway.getCurrentMaintenance
      .mockReturnValueOnce(of({ ticket: assignedTicket }))
      .mockReturnValueOnce(
        of({ ticket: { ...assignedTicket, status: 'IN_PROGRESS' } })
      );
    const fixture = createComponent();

    fixture.componentInstance.startMaintenance();
    fixture.detectChanges();

    expect(gateway.getCurrentMaintenance).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.ticket()?.status).toBe('IN_PROGRESS');
    expect(fixture.nativeElement.textContent).toContain(
      'La mantención cambió de estado'
    );
  });

  it('loads persisted technical information into a typed form only in IN_PROGRESS', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    const fixture = createComponent();

    expect(fixture.componentInstance.maintenanceForm.getRawValue()).toEqual({
      diagnosis: 'Pérdida en la válvula de descarga',
      workPerformed: '',
      notes: 'Revisar presión después del ajuste',
    });
    expect(
      fixture.nativeElement.querySelector('#maintenance-diagnosis')
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Guardar información técnica'
    );
  });

  it('sends only normalized fields that changed and refreshes the baseline', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    gateway.updateMaintenance.mockReturnValue(
      of({
        ...inProgressTicket,
        maintenance: {
          ...inProgressTicket.maintenance!,
          diagnosis: 'Válvula de descarga bloqueada',
        },
      } satisfies TicketDetail)
    );
    const fixture = createComponent();

    fixture.componentInstance.maintenanceForm.controls.diagnosis.setValue(
      '  Válvula de descarga bloqueada  '
    );
    fixture.componentInstance.saveMaintenance();
    fixture.detectChanges();

    expect(gateway.updateMaintenance).toHaveBeenCalledWith(
      inProgressTicket.id,
      { diagnosis: 'Válvula de descarga bloqueada' }
    );
    expect(fixture.componentInstance.hasMaintenanceChanges()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'La información técnica fue guardada correctamente'
    );
  });

  it('sends null when the technician clears a persisted field', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    gateway.updateMaintenance.mockReturnValue(
      of({
        ...inProgressTicket,
        maintenance: { ...inProgressTicket.maintenance!, notes: null },
      } satisfies TicketDetail)
    );
    const fixture = createComponent();

    fixture.componentInstance.maintenanceForm.controls.notes.setValue('   ');
    fixture.componentInstance.saveMaintenance();

    expect(gateway.updateMaintenance).toHaveBeenCalledWith(
      inProgressTicket.id,
      { notes: null }
    );
  });

  it('does not send a maintenance update when normalized values did not change', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    const fixture = createComponent();

    fixture.componentInstance.maintenanceForm.controls.diagnosis.setValue(
      '  Pérdida en la válvula de descarga  '
    );
    fixture.componentInstance.saveMaintenance();
    fixture.detectChanges();

    expect(fixture.componentInstance.hasMaintenanceChanges()).toBe(false);
    expect(gateway.updateMaintenance).not.toHaveBeenCalled();
    const saveButton = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.includes(
        'Guardar información técnica'
      )
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('refreshes authoritative state after an update conflict', () => {
    gateway.getCurrentMaintenance
      .mockReturnValueOnce(of({ ticket: inProgressTicket }))
      .mockReturnValueOnce(of({ ticket: assignedTicket }));
    gateway.updateMaintenance.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })
      ) as Observable<TicketDetail>
    );
    const fixture = createComponent();

    fixture.componentInstance.maintenanceForm.controls.diagnosis.setValue(
      'Diagnóstico nuevo'
    );
    fixture.componentInstance.saveMaintenance();
    fixture.detectChanges();

    expect(gateway.getCurrentMaintenance).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.ticket()?.status).toBe('ASSIGNED');
    expect(fixture.nativeElement.textContent).toContain(
      'La mantención cambió de estado y no pudo actualizarse'
    );
    expect(
      fixture.nativeElement.querySelector('#maintenance-diagnosis')
    ).toBeNull();
  });

  it('requires a non-empty detail when the freeze reason is OTHER', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    const fixture = createComponent();

    fixture.componentInstance.freezeForm.controls.reasonType.setValue('OTHER');
    fixture.detectChanges();

    expect(fixture.componentInstance.freezeDetailRequired()).toBe(true);
    expect(fixture.componentInstance.canRequestFreeze()).toBe(false);
    expect(fixture.nativeElement.querySelector('#freeze-detail')).not.toBeNull();

    fixture.componentInstance.freezeForm.controls.reasonDetail.setValue(
      '  Se requiere soporte externo  '
    );
    expect(fixture.componentInstance.canRequestFreeze()).toBe(true);
  });

  it('requests a freeze, preserves the current technician, and hides technical actions', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    const freezeRequestedTicket: TicketDetail = {
      ...inProgressTicket,
      status: 'FREEZE_REQUESTED',
      freezeRequests: [
        {
          id: 'freeze-id',
          technician: { id: 'technician-id', name: 'Diego Pérez' },
          reasonType: 'OTHER',
          reasonDetail: 'Se requiere soporte externo',
          status: 'PENDING',
          requestedAt: '2026-08-27T12:00:00.000Z',
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
        },
      ],
    };
    gateway.requestFreeze.mockReturnValue(of(freezeRequestedTicket));
    const fixture = createComponent();

    fixture.componentInstance.freezeForm.setValue({
      reasonType: 'OTHER',
      reasonDetail: '  Se requiere soporte externo  ',
    });
    fixture.componentInstance.requestFreeze();
    fixture.detectChanges();

    expect(gateway.requestFreeze).toHaveBeenCalledWith(inProgressTicket.id, {
      reasonType: 'OTHER',
      reasonDetail: 'Se requiere soporte externo',
    });
    expect(fixture.componentInstance.ticket()?.status).toBe(
      'FREEZE_REQUESTED'
    );
    expect(fixture.componentInstance.ticket()?.currentTechnician?.id).toBe(
      'technician-id'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'La solicitud de congelamiento fue enviada correctamente'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Continúas asignado y ocupado'
    );
    expect(
      fixture.nativeElement.querySelector('#maintenance-diagnosis')
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('#freeze-reason')).toBeNull();
  });

  it('omits reasonDetail for a predefined freeze reason', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    gateway.requestFreeze.mockReturnValue(
      of({ ...inProgressTicket, status: 'FREEZE_REQUESTED' })
    );
    const fixture = createComponent();

    fixture.componentInstance.freezeForm.controls.reasonType.setValue(
      'SPARE_PART_UNAVAILABLE'
    );
    fixture.componentInstance.requestFreeze();

    expect(gateway.requestFreeze).toHaveBeenCalledWith(inProgressTicket.id, {
      reasonType: 'SPARE_PART_UNAVAILABLE',
    });
  });

  it('does not offer freeze controls outside IN_PROGRESS', () => {
    const fixture = createComponent();

    fixture.componentInstance.freezeForm.controls.reasonType.setValue(
      'SPARE_PART_UNAVAILABLE'
    );
    fixture.componentInstance.requestFreeze();

    expect(gateway.requestFreeze).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#freeze-reason')).toBeNull();
  });

  it('requires final work before resolving and preloads persisted work', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({ ticket: inProgressTicket })
    );
    const fixture = createComponent();

    expect(fixture.componentInstance.canResolve()).toBe(false);
    expect(fixture.nativeElement.querySelector('#resolution-work')).not.toBeNull();

    fixture.componentInstance.resolutionForm.controls.workPerformed.setValue(
      '  Se ajustó la válvula y se verificó la presión  '
    );
    expect(fixture.componentInstance.canResolve()).toBe(true);
  });

  it('uses previously recorded work as the initial resolution value', () => {
    gateway.getCurrentMaintenance.mockReturnValue(
      of({
        ticket: {
          ...inProgressTicket,
          maintenance: {
            ...inProgressTicket.maintenance!,
            workPerformed: 'Se reemplazó el sello principal',
          },
        },
      })
    );
    const component = createComponent();
    expect(
      component.componentInstance.resolutionForm.controls.workPerformed.value
    ).toBe('Se reemplazó el sello principal');
  });

  it('resolves, confirms release with the backend, and shows the available state', () => {
    gateway.getCurrentMaintenance
      .mockReturnValueOnce(of({ ticket: inProgressTicket }))
      .mockReturnValueOnce(of({ ticket: null }));
    gateway.resolveMaintenance.mockReturnValue(
      of({
        ...inProgressTicket,
        status: 'RESOLVED',
        currentTechnician: null,
        resolvedBy: { id: 'technician-id', name: 'Diego Pérez' },
        resolvedAt: '2026-08-27T13:00:00.000Z',
        maintenance: {
          ...inProgressTicket.maintenance!,
          workPerformed: 'Se reemplazó la válvula de descarga',
        },
      } satisfies TicketDetail)
    );
    const fixture = createComponent();

    fixture.componentInstance.resolutionForm.controls.workPerformed.setValue(
      '  Se reemplazó la válvula de descarga  '
    );
    fixture.componentInstance.resolveMaintenance();
    fixture.detectChanges();

    expect(gateway.resolveMaintenance).toHaveBeenCalledWith(
      inProgressTicket.id,
      { workPerformed: 'Se reemplazó la válvula de descarga' }
    );
    expect(gateway.getCurrentMaintenance).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.ticket()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'La mantención fue resuelta y tu asignación quedó liberada'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Disponibilidad: Disponible'
    );
    expect(
      fixture.nativeElement.querySelector('a[href="/historial-mantenciones"]')
    ).not.toBeNull();
  });

  it('does not resolve outside IN_PROGRESS', () => {
    const fixture = createComponent();

    fixture.componentInstance.resolutionForm.controls.workPerformed.setValue(
      'Trabajo final'
    );
    fixture.componentInstance.resolveMaintenance();

    expect(gateway.resolveMaintenance).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#resolution-work')).toBeNull();
  });

  it('shows a recoverable load error', () => {
    const pending = new Subject<CurrentMaintenanceResponse>();
    gateway.getCurrentMaintenance.mockReturnValue(pending.asObservable());
    const fixture = createComponent();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    pending.error(new Error('Network error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar tu mantención'
    );
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
});
