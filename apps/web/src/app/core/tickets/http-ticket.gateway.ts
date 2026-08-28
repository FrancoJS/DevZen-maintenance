import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  AdminTicketFilters,
  AdminFreezeGateway,
  AdminTicketHistoryGateway,
  AdminTicketGateway,
  ListMyTicketsQuery,
  MaintenanceHistoryFilters,
  TechnicianMaintenanceGateway,
  TicketGateway,
} from './ticket.gateway';
import {
  CreateTicketRequest,
  AssetSummary,
  CatalogResponse,
  ApproveFreezeRequest,
  CurrentMaintenanceResponse,
  FreezeRequestsResponse,
  GlobalTicketHistoryResponse,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  LocationSummary,
  RequestFreezeRequest,
  RejectFreezeRequest,
  ResolveMaintenanceRequest,
  TicketDetail,
  UpdateMaintenanceRequest,
  UpdateTicketRequest,
} from './ticket.models';

@Injectable()
export class HttpTicketGateway
  implements
    TicketGateway,
    AdminTicketGateway,
    AdminTicketHistoryGateway,
    AdminFreezeGateway,
    TechnicianMaintenanceGateway
{
  private readonly http = inject(HttpClient);

  createTicket(request: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets`, request);
  }

  listLocations(): Observable<CatalogResponse<LocationSummary>> {
    return this.http.get<CatalogResponse<LocationSummary>>(`${API_BASE_URL}/locations`);
  }

  listAssets(): Observable<CatalogResponse<AssetSummary>> {
    return this.http.get<CatalogResponse<AssetSummary>>(`${API_BASE_URL}/assets`);
  }

  listMyTickets(
    query: ListMyTicketsQuery
  ): Observable<PaginatedTicketsResponse> {
    const params: Record<string, string | number> = {
      page: query.page,
      limit: query.limit,
    };
    if (query.status) params['status'] = query.status;
    if (query.priority) params['priority'] = query.priority;

    return this.http.get<PaginatedTicketsResponse>(`${API_BASE_URL}/tickets`, {
      params,
    });
  }

  listTickets(
    filters: AdminTicketFilters
  ): Observable<PaginatedTicketsResponse> {
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

  updateTicket(
    id: string,
    request: UpdateTicketRequest
  ): Observable<TicketDetail> {
    return this.http.patch<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}`,
      request
    );
  }

  assignTechnician(id: string, technicianId: string): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets/${id}/assign`, {
      technicianId,
    });
  }

  closeTicket(id: string): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets/${id}/close`, {});
  }

  listGlobalClosedHistory(): Observable<GlobalTicketHistoryResponse> {
    return this.http.get<GlobalTicketHistoryResponse>(
      `${API_BASE_URL}/tickets/admin/history`
    );
  }

  listFreezeRequests(): Observable<FreezeRequestsResponse> {
    return this.http.get<FreezeRequestsResponse>(
      `${API_BASE_URL}/freeze-requests`
    );
  }

  approveFreezeRequest(
    ticketId: string,
    freezeRequestId: string,
    request: ApproveFreezeRequest
  ): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${ticketId}/freeze-requests/${freezeRequestId}/approve`,
      request
    );
  }

  rejectFreezeRequest(
    ticketId: string,
    freezeRequestId: string,
    request: RejectFreezeRequest
  ): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${ticketId}/freeze-requests/${freezeRequestId}/reject`,
      request
    );
  }

  resolveBlocker(ticketId: string): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${ticketId}/resolve-blocker`,
      {}
    );
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

  uploadFinalEvidence(id: string, file: File): Observable<TicketDetail> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<TicketDetail>(
      `${API_BASE_URL}/tickets/${id}/final-evidence`,
      formData
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
