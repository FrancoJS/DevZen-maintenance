import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockTicketGateway } from './mock-ticket.gateway';
import { CreateTicketRequest, ImpactAssessment, TicketPriority } from './ticket.models';

const baseRequest: CreateTicketRequest = {
  description: 'La bomba hidráulica no inicia.',
  area: 'Producción',
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
    ['Crítica por riesgo de seguridad', { safetyRisk: true }, 'CRITICAL'],
    [
      'Crítica por producción detenida y sin alternativa',
      { productionImpact: 'STOPPED', workaroundAvailable: false },
      'CRITICAL',
    ],
  ];

  it.each(scenarios)('calcula prioridad %s', async (_name, impactOverrides, expectedPriority) => {
    const gateway = new MockTicketGateway();
    const request: CreateTicketRequest = {
      ...baseRequest,
      impactAssessment: {
        ...baseRequest.impactAssessment,
        ...impactOverrides,
      },
    };

    const response = await firstValueFrom(gateway.createTicket(request));

    expect(response.ticket.priority).toBe(expectedPriority);
    expect(response.ticket.status).toBe('NEW');
    expect(response.ticket.id).toBe('TK-MOCK-0001');
  });
});
