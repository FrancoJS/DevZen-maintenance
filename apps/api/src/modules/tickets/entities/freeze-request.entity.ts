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
import { FreezeReasonType } from '../enums/freeze-reason-type.enum';
import { FreezeRequestStatus } from '../enums/freeze-request-status.enum';
import { Ticket } from './ticket.entity';

@Entity({ name: 'freeze_requests' })
@Index('idx_freeze_requests_status_requested_at', ['status', 'requestedAt'])
@Check(
  'chk_freeze_requests_other_detail',
  `"reason_type" <> 'OTHER' OR NULLIF(BTRIM("reason_detail"), '') IS NOT NULL`,
)
@Check(
  'chk_freeze_requests_review_fields',
  `("status" = 'PENDING' AND "reviewed_by_id" IS NULL AND "reviewed_at" IS NULL) OR ("status" IN ('APPROVED', 'REJECTED') AND "reviewed_by_id" IS NOT NULL AND "reviewed_at" IS NOT NULL)`,
)
export class FreezeRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId!: string;

  @Column({
    name: 'reason_type',
    type: 'enum',
    enum: FreezeReasonType,
    enumName: 'freeze_reason_type',
  })
  reasonType!: FreezeReasonType;

  @Column({ name: 'reason_detail', type: 'text', nullable: true })
  reasonDetail!: string | null;

  @Column({
    type: 'enum',
    enum: FreezeRequestStatus,
    enumName: 'freeze_request_status',
    default: FreezeRequestStatus.PENDING,
  })
  status!: FreezeRequestStatus;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamptz' })
  requestedAt!: Date;

  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.freezeRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @ManyToOne(() => User, (user) => user.freezeRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'technician_id' })
  technician!: User;

  @ManyToOne(() => User, (user) => user.freezeRequestsReviewed, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy!: User | null;
}
