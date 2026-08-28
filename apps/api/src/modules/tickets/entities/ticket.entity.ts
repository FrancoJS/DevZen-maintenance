import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketHistory } from '../../history/entities/ticket-history.entity';
import { User } from '../../users/entities/user.entity';
import { AssignmentHistory } from './assignment-history.entity';
import { FreezeRequest } from './freeze-request.entity';
import { ImpactAssessment } from './impact-assessment.entity';
import { Maintenance } from './maintenance.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { TicketEvidence } from './ticket-evidence.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity({ name: 'tickets' })
@Index('idx_tickets_status', ['status'])
@Index('idx_tickets_priority', ['priority'])
@Index('idx_tickets_requester_created_at', ['requesterId', 'createdAt'])
@Index('idx_tickets_current_technician', ['currentTechnicianId'])
@Check(
  'chk_tickets_current_technician_by_status',
  `("status" IN ('ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED') AND "current_technician_id" IS NOT NULL) OR ("status" NOT IN ('ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED') AND "current_technician_id" IS NULL)`,
)
@Check(
  'chk_tickets_resolution_fields',
  `("status" IN ('RESOLVED', 'CLOSED') AND "resolved_at" IS NOT NULL AND "resolved_by_id" IS NOT NULL) OR ("status" NOT IN ('RESOLVED', 'CLOSED') AND "resolved_at" IS NULL AND "resolved_by_id" IS NULL)`,
)
@Check(
  'chk_tickets_closure_fields',
  `("status" = 'CLOSED' AND "closed_at" IS NOT NULL AND "closed_by_id" IS NOT NULL) OR ("status" <> 'CLOSED' AND "closed_at" IS NULL AND "closed_by_id" IS NULL)`,
)
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_tickets_ticket_code', { unique: true })
  @Column({
    name: 'ticket_code',
    type: 'varchar',
    length: 32,
    unique: true,
    update: false,
    default: () => "'TCK-' || nextval('ticket_code_sequence')::text",
  })
  ticketCode!: string;

  @Column({ type: 'varchar', length: 1000 })
  description!: string;

  @Column({ name: 'asset_id', type: 'uuid', nullable: true })
  assetId!: string | null;

  @Column({ type: 'varchar', length: 200 })
  location!: string;

  @Column({ type: 'varchar', length: 200 })
  asset!: string;

  @Column({ type: 'enum', enum: TicketPriority, enumName: 'ticket_priority' })
  priority!: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    enumName: 'ticket_status',
    default: TicketStatus.NEW,
  })
  status!: TicketStatus;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId!: string;

  @Column({ name: 'current_technician_id', type: 'uuid', nullable: true })
  currentTechnicianId!: string | null;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ name: 'closed_by_id', type: 'uuid', nullable: true })
  closedById!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.requestedTickets, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @ManyToOne(() => Asset, (asset) => asset.tickets, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'asset_id' })
  machine!: Asset | null;

  @ManyToOne(() => User, (user) => user.currentTickets, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'current_technician_id' })
  currentTechnician!: User | null;

  @ManyToOne(() => User, (user) => user.resolvedTickets, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy!: User | null;

  @ManyToOne(() => User, (user) => user.closedTickets, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy!: User | null;

  @OneToOne(() => ImpactAssessment, (assessment) => assessment.ticket)
  impactAssessment!: ImpactAssessment;

  @OneToOne(() => Maintenance, (maintenance) => maintenance.ticket)
  maintenance!: Maintenance | null;

  @OneToMany(() => FreezeRequest, (request) => request.ticket)
  freezeRequests!: FreezeRequest[];

  @OneToMany(() => AssignmentHistory, (assignment) => assignment.ticket)
  assignments!: AssignmentHistory[];

  @OneToMany(() => TicketHistory, (history) => history.ticket)
  history!: TicketHistory[];

  @OneToMany(() => TicketEvidence, (evidence) => evidence.ticket)
  evidences!: TicketEvidence[];
}
