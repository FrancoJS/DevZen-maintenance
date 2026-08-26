import { TicketPriority, TicketStatus, UserRole } from '../../../core/tickets/ticket.models';

export type MaintenanceHistoryScope = 'personal' | 'global';

export type MaintenanceHistoryAction =
  | 'CREATED'
  | 'PRIORITY_CALCULATED'
  | 'ASSIGNED'
  | 'STARTED'
  | 'FREEZE_REQUESTED'
  | 'FREEZE_APPROVED'
  | 'BLOCKER_RESOLVED'
  | 'REASSIGNED'
  | 'RESOLVED'
  | 'CLOSED';

export interface MaintenanceParticipant {
  id: string;
  name: string;
  assignedAt: string;
  releasedAt?: string;
  releaseReason?: string;
}

export interface MaintenanceHistoryActor {
  id: string;
  name: string;
  role: UserRole;
}

export interface MaintenanceHistoryEvent {
  id: string;
  action: MaintenanceHistoryAction;
  actor: MaintenanceHistoryActor;
  occurredAt: string;
  previousStatus?: TicketStatus;
  newStatus?: TicketStatus;
  details?: string;
}

export interface MaintenanceHistoryRecord {
  ticketId: string;
  asset: string;
  location: string;
  requesterName: string;
  priority: TicketPriority;
  status: Extract<TicketStatus, 'RESOLVED' | 'CLOSED'>;
  participants: MaintenanceParticipant[];
  resolvedAt: string;
  closedAt?: string;
  events: MaintenanceHistoryEvent[];
}

export interface MaintenanceHistoryFilters {
  query: string;
  status: MaintenanceHistoryRecord['status'] | '';
  priority: TicketPriority | '';
  technicianId: string;
}
