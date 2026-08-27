import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { TicketGateway } from './ticket.gateway';
import { CreateTicketRequest, TicketDetail } from './ticket.models';

@Injectable()
export class HttpTicketGateway implements Pick<TicketGateway, 'createTicket'> {
  private readonly http = inject(HttpClient);

  createTicket(request: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${API_BASE_URL}/tickets`, request);
  }
}
