import { HttpInterceptorFn } from '@angular/common/http';
import { ACCESS_TOKEN_STORAGE_KEY, API_BASE_URL } from '../api.config';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const accessToken =
    typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  const isApiRequest =
    request.url === API_BASE_URL || request.url.startsWith(`${API_BASE_URL}/`);

  if (!accessToken || !isApiRequest) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    }),
  );
};
