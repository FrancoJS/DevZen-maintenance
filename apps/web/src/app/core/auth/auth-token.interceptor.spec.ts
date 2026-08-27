import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_STORAGE_KEY, API_BASE_URL } from '../api.config';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('adds the stored Bearer token to API requests', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'token-de-prueba');
    const http = TestBed.inject(HttpClient);
    http.get(`${API_BASE_URL}/tickets`).subscribe();

    const request = httpTesting.expectOne(`${API_BASE_URL}/tickets`);
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer token-de-prueba',
    );
    request.flush({});
  });

  it('does not add Authorization without a stored token', () => {
    const http = TestBed.inject(HttpClient);
    http.get(`${API_BASE_URL}/tickets`).subscribe();

    const request = httpTesting.expectOne(`${API_BASE_URL}/tickets`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not expose the token to requests outside the API', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'token-de-prueba');
    const http = TestBed.inject(HttpClient);
    http.get('https://example.com/resource').subscribe();

    const request = httpTesting.expectOne('https://example.com/resource');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
