import { CreateImpactAssessmentDto } from '../dto/create-impact-assessment.dto';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export function calculateTicketPriority(
  assessment: CreateImpactAssessmentDto,
): TicketPriority {
  if (
    assessment.safetyRisk ||
    (assessment.productionImpact === ProductionImpact.STOPPED &&
      !assessment.workaroundAvailable)
  ) {
    return TicketPriority.CRITICAL;
  }

  if (
    assessment.equipmentStopped === EquipmentStopped.YES ||
    assessment.productionImpact === ProductionImpact.STOPPED ||
    (assessment.productionImpact === ProductionImpact.REDUCED &&
      !assessment.workaroundAvailable) ||
    assessment.affectsOtherAreas
  ) {
    return TicketPriority.HIGH;
  }

  if (
    assessment.equipmentStopped === EquipmentStopped.PARTIAL ||
    assessment.productionImpact === ProductionImpact.REDUCED
  ) {
    return TicketPriority.MEDIUM;
  }

  return TicketPriority.LOW;
}
