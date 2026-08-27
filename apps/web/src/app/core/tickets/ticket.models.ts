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

export interface ImpactAssessment {
  safetyRisk: boolean;
  equipmentStopped: EquipmentStopped;
  productionImpact: ProductionImpact;
  workaroundAvailable: boolean;
  affectsOtherAreas: boolean;
}

export interface CreateTicketRequest {
  description: string;
  area: string;
  location: string;
  asset: string;
  impactAssessment: ImpactAssessment;
}

export interface CreatedTicket {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

export interface CreateTicketResponse {
  ticket: CreatedTicket;
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
