import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTicketRequest,
  ApproveFreezeRequest,
  CurrentMaintenanceResponse,
  FreezeRequestsResponse,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  RequestFreezeRequest,
  RejectFreezeRequest,
  ResolveMaintenanceRequest,
  TicketDetail,
  TicketPriority,
  TicketStatus,
  UpdateMaintenanceRequest,
  UpdateTicketRequest,
} from './ticket.models';

/**
 * Boundary between ticket screens and the data source. The production adapter
 * will call POST /api/tickets; screens must not depend on that transport.
 */
export interface TicketGateway {
  createTicket(request: CreateTicketRequest): Observable<TicketDetail>;
  listMyTickets(
    query: ListMyTicketsQuery
  ): Observable<PaginatedTicketsResponse>;
  getTicket(id: string): Observable<TicketDetail>;
  updateTicket(
    id: string,
    request: UpdateTicketRequest
  ): Observable<TicketDetail>;
}

export const TICKET_GATEWAY = new InjectionToken<TicketGateway>('TICKET_GATEWAY');

export interface ListMyTicketsQuery {
  page: number;
  limit: number;
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface AdminTicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface AdminTicketGateway {
  listTickets(filters: AdminTicketFilters): Observable<PaginatedTicketsResponse>;
  listTechnicians(): Observable<PaginatedTechniciansResponse>;
  getTicket(id: string): Observable<TicketDetail>;
  assignTechnician(id: string, technicianId: string): Observable<TicketDetail>;
  closeTicket(id: string): Observable<TicketDetail>;
}

export const ADMIN_TICKET_GATEWAY = new InjectionToken<AdminTicketGateway>(
  'ADMIN_TICKET_GATEWAY'
);

export interface AdminFreezeGateway {
  listFreezeRequests(): Observable<FreezeRequestsResponse>;
  approveFreezeRequest(
    ticketId: string,
    freezeRequestId: string,
    request: ApproveFreezeRequest
  ): Observable<TicketDetail>;
  rejectFreezeRequest(
    ticketId: string,
    freezeRequestId: string,
    request: RejectFreezeRequest
  ): Observable<TicketDetail>;
  resolveBlocker(ticketId: string): Observable<TicketDetail>;
  assignTechnician(
    ticketId: string,
    technicianId: string
  ): Observable<TicketDetail>;
  listTechnicians(): Observable<PaginatedTechniciansResponse>;
}

export const ADMIN_FREEZE_GATEWAY = new InjectionToken<AdminFreezeGateway>(
  'ADMIN_FREEZE_GATEWAY'
);

export interface MaintenanceHistoryFilters {
  page: number;
  limit: number;
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface TechnicianMaintenanceGateway {
  getCurrentMaintenance(): Observable<CurrentMaintenanceResponse>;
  startMaintenance(id: string): Observable<TicketDetail>;
  updateMaintenance(
    id: string,
    request: UpdateMaintenanceRequest
  ): Observable<TicketDetail>;
  requestFreeze(
    id: string,
    request: RequestFreezeRequest
  ): Observable<TicketDetail>;
  resolveMaintenance(
    id: string,
    request: ResolveMaintenanceRequest
  ): Observable<TicketDetail>;
  listMaintenanceHistory(
    filters: MaintenanceHistoryFilters
  ): Observable<PaginatedTicketsResponse>;
  getTicket(id: string): Observable<TicketDetail>;
}

export const TECHNICIAN_MAINTENANCE_GATEWAY =
  new InjectionToken<TechnicianMaintenanceGateway>(
    'TECHNICIAN_MAINTENANCE_GATEWAY'
  );
