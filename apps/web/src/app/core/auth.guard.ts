import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PreviewSessionService } from './preview-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(PreviewSessionService);
  const router = inject(Router);

  return session.isAuthenticated() || router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(PreviewSessionService);
  const router = inject(Router);

  return !session.isAuthenticated() || router.createUrlTree(['/inicio']);
};
