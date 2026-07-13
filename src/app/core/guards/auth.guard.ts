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
    if (auth.hasRole('SUPER_ADMIN')) {
      return router.createUrlTree(['/suite']);
    }
    return router.createUrlTree(['/home']);
  }

  // SUPER_ADMIN no usa bandeja tenant
  if (
    auth.hasRole('SUPER_ADMIN') &&
    (state.url === '/home' || state.url.startsWith('/home?'))
  ) {
    return router.createUrlTree(['/suite']);
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

  if (auth.hasRole('SUPER_ADMIN')) {
    return router.createUrlTree(['/suite']);
  }

  return router.createUrlTree(['/home']);
};
