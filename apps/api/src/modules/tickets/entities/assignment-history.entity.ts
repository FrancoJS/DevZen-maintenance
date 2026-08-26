import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AssignmentReleaseReason } from '../enums/assignment-release-reason.enum';
import { Ticket } from './ticket.entity';

@Entity({ name: 'assignment_histories' })
@Index('idx_assignment_histories_ticket_assigned_at', [
  'ticketId',
  'assignedAt',
])
@Index('idx_assignment_histories_technician_assigned_at', [
  'technicianId',
  'assignedAt',
])
@Check(
  'chk_assignment_histories_release_fields',
  `("released_at" IS NULL AND "release_reason" IS NULL) OR ("released_at" IS NOT NULL AND "release_reason" IS NOT NULL)`,
)
export class AssignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId!: string;

  @Column({ name: 'assigned_by_id', type: 'uuid' })
  assignedById!: string;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;

  @Column({
    name: 'release_reason',
    type: 'enum',
    enum: AssignmentReleaseReason,
    enumName: 'assignment_release_reason',
    nullable: true,
  })
  releaseReason!: AssignmentReleaseReason | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.assignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @ManyToOne(() => User, (user) => user.technicianAssignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'technician_id' })
  technician!: User;

  @ManyToOne(() => User, (user) => user.assignmentsMade, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy!: User;
}
