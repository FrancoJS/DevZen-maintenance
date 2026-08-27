import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  AdminTicketFilters,
  AdminTicketGateway,
  MaintenanceHistoryFilters,
  TechnicianMaintenanceGateway,
  TicketGateway,
} from './ticket.gateway';
import {
  CreateTicketRequest,
  CurrentMaintenanceResponse,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  RequestFreezeRequest,
  ResolveMaintenanceRequest,
  TicketDetail,
  UpdateMaintenanceRequest,
} from './ticket.models';

@Injectable()
export class HttpTicketGateway
  implements
    Pick<TicketGateway, 'createTicket'>,
    AdminTicketGateway,
    TechnicianMaintenanceGateway
{
  private readonly http = inject(HttpClient);

  createTicket(request: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets`, request);
  }

  listTickets(filters: AdminTicketFilters): Observable<PaginatedTicketsResponse> {
    const params: Record<string, string | number> = { page: 1, limit: 100 };
    if (filters.status) params['status'] = filters.status;
    if (filters.priority) params['priority'] = filters.priority;

    return this.http.get<PaginatedTicketsResponse>(`${API_BASE_URL}/tickets`, {
      params,
    });
  }

  listTechnicians(): Observable<PaginatedTechniciansResponse> {
    return this.http.get<PaginatedTechniciansResponse>(
      `${API_BASE_URL}/technicians`,
      { params: { page: 1, limit: 100 } }
    );
  }

  getTicket(id: string): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${API_BASE_URL}/tickets/${id}`);
  }

  assignTechnician(id: string, technicianId: string): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets/${id}/assign`, {
      technicianId,
    });
  }

  getCurrentMaintenance(): Observable<CurrentMaintenanceResponse> {
    return this.http.get<CurrentMaintenanceResponse>(
      `${API_BASE_URL}/tickets/my-maintenance`
    );
  }

  startMaintenance(id: string): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}/start`,
      {}
    );
  }

  updateMaintenance(
    id: string,
    request: UpdateMaintenanceRequest
  ): Observable<TicketDetail> {
    return this.http.patch<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}/maintenance`,
      request
    );
  }

  requestFreeze(
    id: string,
    request: RequestFreezeRequest
  ): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}/freeze-requests`,
      request
    );
  }

  resolveMaintenance(
    id: string,
    request: ResolveMaintenanceRequest
  ): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}/resolve`,
      request
    );
  }

  listMaintenanceHistory(
    filters: MaintenanceHistoryFilters
  ): Observable<PaginatedTicketsResponse> {
    const params: Record<string, string | number> = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.status) params['status'] = filters.status;
    if (filters.priority) params['priority'] = filters.priority;

    return this.http.get<PaginatedTicketsResponse>(
      `${API_BASE_URL}/tickets/my-maintenance-history`,
      { params }
    );
  }
}
