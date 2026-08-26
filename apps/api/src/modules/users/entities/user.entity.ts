import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssignmentHistory } from '../../tickets/entities/assignment-history.entity';
import { FreezeRequest } from '../../tickets/entities/freeze-request.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketHistory } from '../../history/entities/ticket-history.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.requester)
  requestedTickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.currentTechnician)
  currentTickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.resolvedBy)
  resolvedTickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.closedBy)
  closedTickets!: Ticket[];

  @OneToMany(() => AssignmentHistory, (assignment) => assignment.technician)
  technicianAssignments!: AssignmentHistory[];

  @OneToMany(() => AssignmentHistory, (assignment) => assignment.assignedBy)
  assignmentsMade!: AssignmentHistory[];

  @OneToMany(() => FreezeRequest, (request) => request.technician)
  freezeRequests!: FreezeRequest[];

  @OneToMany(() => FreezeRequest, (request) => request.reviewedBy)
  freezeRequestsReviewed!: FreezeRequest[];

  @OneToMany(() => TicketHistory, (history) => history.actor)
  historyEntries!: TicketHistory[];
}
