import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  AdminTicketFilters,
  AdminTicketGateway,
  ListMyTicketsQuery,
  TicketGateway,
} from './ticket.gateway';
import {
  CreateTicketRequest,
  PaginatedTechniciansResponse,
  PaginatedTicketsResponse,
  TicketDetail,
} from './ticket.models';

@Injectable()
export class HttpTicketGateway
  implements TicketGateway, AdminTicketGateway
{
  private readonly http = inject(HttpClient);

  createTicket(request: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets`, request);
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
}
