import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { Role } from '../models/user.model';

/**
 * ============================================================================
 * authGuard — protección de rutas por JWT y rol
 * ============================================================================
 *
 * Uso en app.routes.ts:
 *   { path: 'home', canActivate: [authGuard], component: HomeComponent }
 *   { path: 'admin', canActivate: [authGuard], data: { roles: ['ADMIN'] }, ... }
 *
 * Flujo:
 *   1. Lee data.roles de la ruta (opcional).
 *   2. Delega en AuthService.isAuthenticated(roles?).
 *   3. Si falla → redirige a /login con returnUrl.
 *
 * Nota: la autorización real siempre se revalida en el backend (role middleware).
 * Este guard solo mejora UX y evita pantallas incorrectas.
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: route.url.map((s) => s.path).join('/') || 'home' },
    });
  }

  if (allowedRoles?.length && !auth.isAuthenticated(allowedRoles)) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

/**
 * Guard inverso: si ya hay sesión, no mostrar /login.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
