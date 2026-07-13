import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
}

export interface CreateEmpresaPayload {
  nombre: string;
  slug?: string;
  adminEmail: string;
  adminNombre: string;
  adminPassword: string;
}

export interface CreateEmpresaResult {
  empresa: Empresa;
  admin: { id: string; email: string; nombre: string; role: 'ADMIN' };
}

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);

  list(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${environment.apiUrl}/empresas`);
  }

  create(payload: CreateEmpresaPayload): Observable<CreateEmpresaResult> {
    return this.http.post<CreateEmpresaResult>(`${environment.apiUrl}/empresas`, payload);
  }
}
