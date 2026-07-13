import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  of,
  tap,
  catchError,
  map,
  switchMap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginResponse, Role, User } from '../models/user.model';
import type { Permission } from '../models/permissions';
import { CatalogosService } from './catalogos.service';
import { CasosService } from './casos.service';
import { encryptLoginCredentials } from '../utils/login-crypto';

const USER_KEY = 'ally_flow_user';
const LEGACY_TOKEN_KEY = 'ally_flow_token';

/**
 * Auth — cookie httpOnly + login cifrado (ek/iv/ct).
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

  hydrateSession(): Observable<User | null> {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    // Sin user local → no hay sesión previa; no llamar /me (evita 401 ruidoso en login).
    if (!this.readStoredUser()) {
      return of(null);
    }
    return this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        this.persistUser(res.user);
        this.userSubject.next(res.user);
      }),
      map((res) => res.user),
      catchError(() => {
        this.clearLocalSession();
        return of(null);
      }),
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .get<{ publicKey: string }>(`${environment.apiUrl}/auth/public-key`)
      .pipe(
        switchMap(async (crypto) => {
          const body = await encryptLoginCredentials(crypto.publicKey, email, password);
          return body;
        }),
        switchMap((body) =>
          this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body),
        ),
        tap((res) => {
          this.clearMetaCaches();
          localStorage.removeItem(LEGACY_TOKEN_KEY);
          this.persistUser(res.user);
          this.userSubject.next(res.user);
        }),
      );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      error: () => undefined,
      complete: () => undefined,
    });
    this.clearLocalSession();
    void this.router.navigate(['/login']);
  }

  isAuthenticated(allowedRoles?: Role[]): boolean {
    const user = this.currentUser;
    if (!user) return false;

    if (user.exp && user.exp * 1000 < Date.now()) {
      this.clearLocalSession();
      return false;
    }

    if (allowedRoles?.length) {
      return allowedRoles.includes(user.role);
    }

    return true;
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return roles.includes(user.role);
  }

  hasPermission(...perms: Permission[]): boolean {
    const user = this.currentUser;
    if (!user?.permissions?.length) return false;
    return perms.every((p) => user.permissions.includes(p));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  private persistUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearLocalSession(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    this.userSubject.next(null);
    this.clearMetaCaches();
  }

  private clearMetaCaches(): void {
    this.catalogos.invalidate();
    this.casos.invalidateMetaCache();
  }

  private readStoredUser(): User | null {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as User;
      if (!user?.id || !user?.role) return null;
      if (!Array.isArray(user.permissions)) {
        user.permissions = [];
      }
      return user;
    } catch {
      return null;
    }
  }
}
