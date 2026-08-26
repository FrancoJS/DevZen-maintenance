import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { EquipmentStopped } from '../enums/equipment-stopped.enum';
import { ProductionImpact } from '../enums/production-impact.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { Ticket } from './ticket.entity';

@Entity({ name: 'impact_assessments' })
export class ImpactAssessment {
  @PrimaryColumn({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'safety_risk', type: 'boolean' })
  safetyRisk!: boolean;

  @Column({
    name: 'equipment_stopped',
    type: 'enum',
    enum: EquipmentStopped,
    enumName: 'equipment_stopped',
  })
  equipmentStopped!: EquipmentStopped;

  @Column({
    name: 'production_impact',
    type: 'enum',
    enum: ProductionImpact,
    enumName: 'production_impact',
  })
  productionImpact!: ProductionImpact;

  @Column({ name: 'workaround_available', type: 'boolean' })
  workaroundAvailable!: boolean;

  @Column({ name: 'affects_other_areas', type: 'boolean' })
  affectsOtherAreas!: boolean;

  @Column({
    name: 'calculated_priority',
    type: 'enum',
    enum: TicketPriority,
    enumName: 'ticket_priority',
  })
  calculatedPriority!: TicketPriority;

  @OneToOne(() => Ticket, (ticket) => ticket.impactAssessment, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;
}
