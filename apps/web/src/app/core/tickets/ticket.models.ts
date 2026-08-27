export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FREEZE_REQUESTED'
  | 'FROZEN'
  | 'PENDING_REASSIGNMENT'
  | 'RESOLVED'
  | 'CLOSED';

export type UserRole = 'REQUESTER' | 'TECHNICIAN' | 'ADMIN';

export type EquipmentStopped = 'YES' | 'PARTIAL' | 'NO';
export type ProductionImpact = 'STOPPED' | 'REDUCED' | 'NONE';

export type TicketHistoryAction =
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'PRIORITY_CALCULATED'
  | 'PRIORITY_OVERRIDDEN'
  | 'TECHNICIAN_ASSIGNED'
  | 'MAINTENANCE_STARTED'
  | 'MAINTENANCE_UPDATED'
  | 'FREEZE_REQUESTED'
  | 'FREEZE_APPROVED'
  | 'FREEZE_REJECTED'
  | 'BLOCKER_RESOLVED'
  | 'TICKET_RESOLVED'
  | 'TICKET_CLOSED';

export interface ImpactAssessment {
  safetyRisk: boolean;
  equipmentStopped: EquipmentStopped;
  productionImpact: ProductionImpact;
  workaroundAvailable: boolean;
  affectsOtherAreas: boolean;
}

export interface CreateTicketRequest {
  description: string;
  location: string;
  asset: string;
  impactAssessment: ImpactAssessment;
}

export interface UpdateTicketRequest {
  description: string;
}

export interface TicketUser {
  id: string;
  name: string;
}

export interface TicketHistoryEntry {
  id: string;
  actor: TicketUser;
  action: TicketHistoryAction;
  previousStatus: TicketStatus | null;
  newStatus: TicketStatus | null;
  previousPriority: TicketPriority | null;
  newPriority: TicketPriority | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export type AssignmentReleaseReason = 'FREEZE_APPROVED' | 'RESOLVED';

export interface TicketAssignment {
  id: string;
  technician: TicketUser;
  assignedBy: TicketUser;
  assignedAt: string;
  startedAt: string | null;
  releasedAt: string | null;
  releaseReason: AssignmentReleaseReason | null;
}

export interface TicketMaintenance {
  diagnosis: string | null;
  workPerformed: string | null;
  notes: string | null;
}

export interface TicketDetail {
  id: string;
  description: string;
  location: string;
  asset: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: TicketUser;
  createdAt: string;
  updatedAt: string;
  impactAssessment: ImpactAssessment & {
    calculatedPriority: TicketPriority;
  };
  currentTechnician: TicketUser | null;
  resolvedBy: TicketUser | null;
  resolvedAt: string | null;
  closedBy: TicketUser | null;
  closedAt: string | null;
  assignments: TicketAssignment[];
  maintenance: TicketMaintenance | null;
  history: TicketHistoryEntry[];
}

export interface TicketSummary {
  id: string;
  description: string;
  location: string;
  asset: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: TicketUser;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTicketsResponse {
  items: TicketSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type TechnicianAvailability = 'AVAILABLE' | 'BUSY';

export interface TechnicianCurrentTicket {
  id: string;
  description: string;
  asset: string;
  priority: TicketPriority;
  status: TicketStatus;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  availability: TechnicianAvailability;
  currentTicket: TechnicianCurrentTicket | null;
}

export interface PaginatedTechniciansResponse {
  items: Technician[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketListItem {
  id: string;
  asset: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

export interface ListMyTicketsResponse {
  tickets: TicketListItem[];
}
