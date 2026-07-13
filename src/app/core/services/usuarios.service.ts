import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Role } from '../models/user.model';

export type TenantManageRole = 'ADMIN' | 'ASESOR' | 'TECNICO';

export interface ManagedUser {
  id: string;
  email: string;
  nombre: string;
  role: TenantManageRole;
  empresaId: string | null;
  activo: boolean;
  esOwner: boolean;
  canEdit: boolean;
}

export interface CreateManagedUserPayload {
  nombre: string;
  email: string;
  password: string;
  role: TenantManageRole;
  empresaId?: string | null;
}

export interface UpdateManagedUserPayload {
  nombre?: string;
  email?: string;
  role?: TenantManageRole;
  activo?: boolean;
}

export interface RoleCapability {
  key: string;
  label: string;
}

export interface RoleInfoRow {
  role: Role;
  label: string;
  capabilities: RoleCapability[];
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  list(empresaId?: string): Observable<ManagedUser[]> {
    const q = empresaId ? `?empresaId=${encodeURIComponent(empresaId)}` : '';
    return this.http.get<ManagedUser[]>(`${environment.apiUrl}/usuarios${q}`);
  }

  rolesInfo(): Observable<RoleInfoRow[]> {
    return this.http.get<RoleInfoRow[]>(`${environment.apiUrl}/usuarios/roles-info`);
  }

  create(
    payload: CreateManagedUserPayload,
  ): Observable<{ user: ManagedUser; password: string }> {
    return this.http.post<{ user: ManagedUser; password: string }>(
      `${environment.apiUrl}/usuarios`,
      payload,
    );
  }

  update(id: string, payload: UpdateManagedUserPayload): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${environment.apiUrl}/usuarios/${id}`, payload);
  }

  resetPassword(id: string, newPassword: string): Observable<{ password: string }> {
    return this.http.post<{ password: string }>(
      `${environment.apiUrl}/usuarios/${id}/reset-password`,
      { newPassword },
    );
  }
}
