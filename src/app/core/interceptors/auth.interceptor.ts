import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Envía cookies (httpOnly session) y cierra sesión ante 401 (excepto login/logout).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const withCreds = req.clone({ withCredentials: true });

  return next(withCreds).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const url = req.url;
        const isAuthPublic =
          url.includes(`${environment.apiUrl}/auth/login`) ||
          url.includes(`${environment.apiUrl}/auth/logout`) ||
          url.includes(`${environment.apiUrl}/auth/me`);
        if (!isAuthPublic && auth.currentUser) {
          auth.logout();
        }
      }
      return throwError(() => err);
    }),
  );
};
