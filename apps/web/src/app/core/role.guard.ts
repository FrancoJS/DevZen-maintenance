import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PreviewSessionService } from './preview-session.service';
import { UserRole } from '../shared/navigation/navigation.model';

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(PreviewSessionService);
  const router = inject(Router);
  const roles = route.data['roles'] as UserRole[] | undefined;
  return !roles || roles.includes(session.role()) || router.createUrlTree(['/inicio']);
};
