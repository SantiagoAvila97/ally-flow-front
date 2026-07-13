import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  nit: string;
  logoDataUrl: string | null;
}

export interface EmpresaListItem extends Empresa {
  owner: { id: string; nombre: string; email: string } | null;
  protegida: boolean;
  canDelete: boolean;
}

export interface CreateEmpresaPayload {
  nombre: string;
  nit: string;
  adminEmail: string;
  adminNombre: string;
  adminPassword: string;
  logoDataUrl: string;
}

export interface CreateEmpresaResult {
  empresa: Empresa;
  admin: {
    id: string;
    email: string;
    nombre: string;
    role: 'ADMIN';
    esOwner: true;
  };
  adminPassword: string;
}

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);

  list(): Observable<EmpresaListItem[]> {
    return this.http.get<EmpresaListItem[]>(`${environment.apiUrl}/empresas`);
  }

  me(): Observable<Empresa> {
    return this.http.get<Empresa>(`${environment.apiUrl}/empresas/me`);
  }

  updateLogo(logoDataUrl: string): Observable<Empresa> {
    return this.http.patch<Empresa>(`${environment.apiUrl}/empresas/me/logo`, {
      logoDataUrl,
    });
  }

  create(payload: CreateEmpresaPayload): Observable<CreateEmpresaResult> {
    return this.http.post<CreateEmpresaResult>(`${environment.apiUrl}/empresas`, payload);
  }

  delete(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/empresas/${id}`);
  }

  /** Restaura tenant DEMO a datos seed (casos, tarifas, clientes, usuarios demo). */
  resetDemo(): Observable<{ ok: boolean; casos: number; users: number }> {
    return this.http.post<{ ok: boolean; casos: number; users: number }>(
      `${environment.apiUrl}/empresas/demo/reset`,
      {},
    );
  }

  /** Limpia casos/tarifas/clientes/plantillas de mi empresa (OWNER). */
  clearMineData(): Observable<{ ok: boolean; empresaId: string; empresaNombre: string }> {
    return this.http.post<{ ok: boolean; empresaId: string; empresaNombre: string }>(
      `${environment.apiUrl}/empresas/me/clear-data`,
      {},
    );
  }
}
