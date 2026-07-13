import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { Role } from '../models/user.model';

/**
 * Protege rutas por JWT y rol (la API revalida siempre).
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!auth.isAuthenticated()) {
    const returnUrl = state.url?.startsWith('/') ? state.url : `/${state.url || 'home'}`;
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl },
    });
  }

  if (allowedRoles?.length && !auth.isAuthenticated(allowedRoles)) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

/** Si ya hay sesión, no mostrar /login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
