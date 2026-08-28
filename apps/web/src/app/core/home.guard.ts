import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PreviewSessionService } from './preview-session.service';

export const homeGuard: CanActivateFn = () => {
  const role = inject(PreviewSessionService).role();
  return (
    role === 'ADMIN' ||
    inject(Router).createUrlTree([
      role === 'TECHNICIAN' ? '/mi-mantencion' : '/mis-solicitudes',
    ])
  );
};
