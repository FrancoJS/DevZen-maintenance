import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/api.config';
import { PaginatedTechniciansResponse } from '../../core/tickets/ticket.models';

export interface AdminDashboardResponse {
  tickets: {
    total: number;
    new: number;
    critical: number;
    inProgress: number;
    frozen: number;
  };
  technicians: { total: number; available: number; busy: number };
  requiresAttention: {
    pendingAssignment: number;
    pendingFreezeApproval: number;
    pendingReassignment: number;
    pendingClosure: number;
  };
}

@Injectable()
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  load() {
    return this.http.get<AdminDashboardResponse>(
      `${API_BASE_URL}/dashboard/admin`,
    );
  }

  listTechnicians(page: number, limit: number) {
    return this.http.get<PaginatedTechniciansResponse>(
      `${API_BASE_URL}/technicians`,
      { params: { page, limit } },
    );
  }
}
