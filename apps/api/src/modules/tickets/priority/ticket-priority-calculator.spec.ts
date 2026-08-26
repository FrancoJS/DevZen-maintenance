import { CreateImpactAssessmentDto } from '../dto/create-impact-assessment.dto';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { calculateTicketPriority } from './ticket-priority-calculator';

const assessment = (
  overrides: Partial<CreateImpactAssessmentDto> = {},
): CreateImpactAssessmentDto => ({
  safetyRisk: false,
  equipmentStopped: EquipmentStopped.NO,
  productionImpact: ProductionImpact.NONE,
  workaroundAvailable: true,
  affectsOtherAreas: false,
  ...overrides,
});

describe('calculateTicketPriority', () => {
  it('returns CRITICAL when there is a safety risk', () => {
    expect(calculateTicketPriority(assessment({ safetyRisk: true }))).toBe(
      TicketPriority.CRITICAL,
    );
  });

  it('returns CRITICAL when production is stopped without a workaround', () => {
    expect(
      calculateTicketPriority(
        assessment({
          productionImpact: ProductionImpact.STOPPED,
          workaroundAvailable: false,
        }),
      ),
    ).toBe(TicketPriority.CRITICAL);
  });

  it('returns HIGH for a completely stopped piece of equipment', () => {
    expect(
      calculateTicketPriority(
        assessment({ equipmentStopped: EquipmentStopped.YES }),
      ),
    ).toBe(TicketPriority.HIGH);
  });

  it('returns MEDIUM for partially stopped equipment', () => {
    expect(
      calculateTicketPriority(
        assessment({ equipmentStopped: EquipmentStopped.PARTIAL }),
      ),
    ).toBe(TicketPriority.MEDIUM);
  });

  it('returns LOW when no rule matches', () => {
    expect(calculateTicketPriority(assessment())).toBe(TicketPriority.LOW);
  });

  it('applies CRITICAL before lower-priority matching rules', () => {
    expect(
      calculateTicketPriority(
        assessment({
          safetyRisk: true,
          equipmentStopped: EquipmentStopped.YES,
          productionImpact: ProductionImpact.REDUCED,
          workaroundAvailable: false,
          affectsOtherAreas: true,
        }),
      ),
    ).toBe(TicketPriority.CRITICAL);
  });
});
