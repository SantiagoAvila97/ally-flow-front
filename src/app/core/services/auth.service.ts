import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { JwtClaims, LoginResponse, Role, User } from '../models/user.model';
import { CatalogosService } from './catalogos.service';
import { CasosService } from './casos.service';

const TOKEN_KEY = 'ally_flow_token';
const USER_KEY = 'ally_flow_user';

/**
 * ============================================================================
 * AuthService — autenticación JWT y sesión de usuario
 * ============================================================================
 *
 * Responsabilidades:
 *  - Login contra POST /api/auth/login
 *  - Persistencia de token + user en localStorage
 *  - Exposición reactiva de currentUser$
 *  - Helpers de rol (hasRole) usados por Guard y Home
 *  - Decodificación del payload JWT (solo lectura; la firma se valida en el backend)
 *
 * Escalabilidad:
 *  - Sustituir localStorage por cookies httpOnly si se endurece seguridad.
 *  - Añadir refresh tokens sin cambiar la API pública de este servicio.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly catalogos = inject(CatalogosService);
  private readonly casos = inject(CasosService);

  private readonly userSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.userSubject.asObservable();

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          // Nueva sesión → no reutilizar catálogos/meta del usuario anterior
          this.clearMetaCaches();
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }),
      );
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /**
   * True si hay token, no está expirado y (opcionalmente) el rol del JWT está permitido.
   * El rol se toma del token (no del user en localStorage) para evitar escalada en UI.
   */
  isAuthenticated(allowedRoles?: Role[]): boolean {
    const token = this.token;
    if (!token) return false;

    const claims = this.decodeToken(token);
    if (!claims) return false;

    if (claims.exp && claims.exp * 1000 < Date.now()) {
      this.clearSession();
      return false;
    }

    if (allowedRoles?.length) {
      return allowedRoles.includes(claims.role);
    }

    return true;
  }

  hasRole(...roles: Role[]): boolean {
    const token = this.token;
    if (!token) return false;
    const claims = this.decodeToken(token);
    if (!claims) return false;
    return roles.includes(claims.role);
  }

  decodeToken(token: string): JwtClaims | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtClaims;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
    this.clearMetaCaches();
  }

  private clearMetaCaches(): void {
    this.catalogos.invalidate();
    this.casos.invalidateMetaCache();
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
