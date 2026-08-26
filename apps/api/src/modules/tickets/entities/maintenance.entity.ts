import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity({ name: 'maintenances' })
export class Maintenance {
  @PrimaryColumn({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ type: 'text', nullable: true })
  diagnosis!: string | null;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'final_evidence_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  finalEvidenceUrl!: string | null;

  @OneToOne(() => Ticket, (ticket) => ticket.maintenance, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;
}
