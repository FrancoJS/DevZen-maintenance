import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AssignmentHistory } from './assignment-history.entity';
import { Ticket } from './ticket.entity';

export enum TicketEvidenceType {
  FINAL = 'FINAL',
}

@Entity({ name: 'ticket_evidences' })
@Index('idx_ticket_evidences_ticket_created_at', ['ticketId', 'createdAt'])
export class TicketEvidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId!: string;

  @Column({ name: 'assignment_id', type: 'uuid' })
  assignmentId!: string;

  @Column({ type: 'enum', enum: TicketEvidenceType, enumName: 'ticket_evidence_type' })
  type!: TicketEvidenceType;

  @Index('uq_ticket_evidences_public_id', { unique: true })
  @Column({ name: 'public_id', type: 'varchar', length: 255, unique: true })
  publicId!: string;

  @Column({ type: 'varchar', length: 64 })
  mimeType!: string;

  @Column({ type: 'integer' })
  size!: number;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.evidences, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'technician_id' })
  technician!: User;

  @ManyToOne(() => AssignmentHistory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment!: AssignmentHistory;
}
