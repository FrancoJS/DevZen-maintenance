import { describe, expect, it } from 'vitest';
import { PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from './ticket-labels';

describe('ticket labels', () => {
  it('traduce las prioridades al español', () => {
    expect(PRIORITY_LABELS).toEqual({
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    });
  });

  it('traduce todos los estados y roles visibles', () => {
    expect(STATUS_LABELS.FROZEN).toBe('Congelada');
    expect(STATUS_LABELS.FREEZE_REQUESTED).toBe('Congelamiento solicitado');
    expect(STATUS_LABELS.CLOSED).toBe('Cerrada');
    expect(ROLE_LABELS.TECHNICIAN).toBe('Técnico');
  });
});
