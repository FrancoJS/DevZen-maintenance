import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewSessionService } from '../preview-session.service';
import { calculatePriority, MockTicketGateway } from './mock-ticket.gateway';
import { CreateTicketRequest, ImpactAssessment, TicketPriority } from './ticket.models';

const baseRequest: CreateTicketRequest = {
  description: 'La bomba hidráulica no inicia.',
  location: 'Planta 2',
  asset: 'Bomba B-02',
  impactAssessment: {
    safetyRisk: false,
    equipmentStopped: 'NO',
    productionImpact: 'NONE',
    workaroundAvailable: true,
    affectsOtherAreas: false,
  },
};

describe('MockTicketGateway', () => {
  const scenarios: Array<[string, Partial<ImpactAssessment>, TicketPriority]> = [
    ['Baja', {}, 'LOW'],
    ['Media por detención parcial', { equipmentStopped: 'PARTIAL' }, 'MEDIUM'],
    ['Media por producción reducida', { productionImpact: 'REDUCED' }, 'MEDIUM'],
    ['Alta por equipo detenido', { equipmentStopped: 'YES' }, 'HIGH'],
    ['Alta por producción detenida', { productionImpact: 'STOPPED' }, 'HIGH'],
    [
      'Alta por producción reducida sin alternativa',
      { productionImpact: 'REDUCED', workaroundAvailable: false },
      'HIGH',
    ],
    ['Alta por afectar otras áreas', { affectsOtherAreas: true }, 'HIGH'],
    ['Crítica por riesgo de seguridad', { safetyRisk: true }, 'CRITICAL'],
    [
      'Crítica por producción detenida y sin alternativa',
      { productionImpact: 'STOPPED', workaroundAvailable: false },
      'CRITICAL',
    ],
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it.each(scenarios)('calcula prioridad %s', (_name, impactOverrides, expectedPriority) => {
    const request: CreateTicketRequest = {
      ...baseRequest,
      impactAssessment: {
        ...baseRequest.impactAssessment,
        ...impactOverrides,
      },
    };

    expect(calculatePriority(request)).toBe(expectedPriority);
  });

  it('lista solo los tickets del usuario activo e incorpora los creados en la sesión', async () => {
    TestBed.configureTestingModule({ providers: [MockTicketGateway] });
    const session = TestBed.inject(PreviewSessionService);
    const gateway = TestBed.inject(MockTicketGateway);

    session.login('camila.rojas@devzen.test', 'Solicitante123!');
    const requesterBefore = await firstValueFrom(gateway.listMyTickets({ page: 1, limit: 20 }));
    expect(requesterBefore.items.map((ticket) => ticket.id)).toContain('TK-1024');
    expect(requesterBefore.items.map((ticket) => ticket.id)).not.toContain('TK-1031');

    const created = await firstValueFrom(gateway.createTicket(baseRequest));
    const requesterAfter = await firstValueFrom(gateway.listMyTickets({ page: 1, limit: 20 }));
    expect(requesterAfter.items.map((ticket) => ticket.id)).toContain(created.id);

    session.login('diego.perez@devzen.test', 'Tecnico123!');
    const technicianTickets = await firstValueFrom(gateway.listMyTickets({ page: 1, limit: 20 }));
    expect(technicianTickets.items.map((ticket) => ticket.id)).toContain('TK-1031');
    expect(technicianTickets.items.map((ticket) => ticket.id)).not.toContain(created.id);

    session.login('ana.gonzalez@devzen.test', 'Admin123!');
    const adminTickets = await firstValueFrom(gateway.listMyTickets({ page: 1, limit: 20 }));
    expect(adminTickets.items.map((ticket) => ticket.id)).toContain('TK-1028');
    expect(adminTickets.items.map((ticket) => ticket.id)).not.toContain('TK-1031');
  });
});
