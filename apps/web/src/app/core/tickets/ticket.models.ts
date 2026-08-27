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
  history: TicketHistoryEntry[];
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
