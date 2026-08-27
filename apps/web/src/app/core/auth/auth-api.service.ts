import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'REQUESTER' | 'TECHNICIAN' | 'ADMIN';
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      { email, password },
    );
  }
}