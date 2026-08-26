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
import { TicketPriority } from '../../tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketHistoryAction } from '../enums/ticket-history-action.enum';

@Entity({ name: 'ticket_histories' })
@Index('idx_ticket_histories_ticket_created_at_id', [
  'ticketId',
  'createdAt',
  'id',
])
export class TicketHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId!: string;

  @Column({
    type: 'enum',
    enum: TicketHistoryAction,
    enumName: 'ticket_history_action',
  })
  action!: TicketHistoryAction;

  @Column({
    name: 'previous_status',
    type: 'enum',
    enum: TicketStatus,
    enumName: 'ticket_status',
    nullable: true,
  })
  previousStatus!: TicketStatus | null;

  @Column({
    name: 'new_status',
    type: 'enum',
    enum: TicketStatus,
    enumName: 'ticket_status',
    nullable: true,
  })
  newStatus!: TicketStatus | null;

  @Column({
    name: 'previous_priority',
    type: 'enum',
    enum: TicketPriority,
    enumName: 'ticket_priority',
    nullable: true,
  })
  previousPriority!: TicketPriority | null;

  @Column({
    name: 'new_priority',
    type: 'enum',
    enum: TicketPriority,
    enumName: 'ticket_priority',
    nullable: true,
  })
  newPriority!: TicketPriority | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.history, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @ManyToOne(() => User, (user) => user.historyEntries, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'actor_id' })
  actor!: User;
}
