import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Aseguradora, CatalogosPayload, CiudadCatalogo } from '../models/catalogo.model';

interface ApiList<T> {
  data: T;
}

export interface AseguradoraInput {
  nombre: string;
  nit?: string | null;
  personaResponsable?: string | null;
  contactoCobros?: string | null;
  whatsapp?: string | null;
  activa?: boolean;
}

/**
 * Catálogos de referencia (aseguradoras, ciudades, categorías).
 * Lectura: una sola vez por sesión.
 * Mutaciones de aseguradoras (ADMIN): invalidan el cache.
 */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/catalogos`;

  private all$?: Observable<CatalogosPayload>;

  getAll(): Observable<CatalogosPayload> {
    if (!this.all$) {
      this.all$ = this.http.get<ApiList<CatalogosPayload>>(this.base).pipe(
        map((r) => r.data),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.all$;
  }

  invalidate(): void {
    this.all$ = undefined;
  }

  getAseguradoras(all = false): Observable<Aseguradora[]> {
    const params = all ? { all: '1' } : undefined;
    return this.http
      .get<ApiList<Aseguradora[]>>(`${this.base}/aseguradoras`, { params })
      .pipe(map((r) => r.data));
  }

  getCiudades(all = false): Observable<CiudadCatalogo[]> {
    const params = all ? { all: '1' } : undefined;
    return this.http
      .get<ApiList<CiudadCatalogo[]>>(`${this.base}/ciudades`, { params })
      .pipe(map((r) => r.data));
  }

  getCategoriasServicio(): Observable<string[]> {
    return this.getAll().pipe(map((c) => c.categoriasServicio));
  }

  createAseguradora(payload: AseguradoraInput): Observable<Aseguradora> {
    return this.http
      .post<ApiList<Aseguradora>>(`${this.base}/aseguradoras`, payload)
      .pipe(
        map((r) => {
          this.invalidate();
          return r.data;
        }),
      );
  }

  updateAseguradora(id: string, payload: Partial<AseguradoraInput>): Observable<Aseguradora> {
    return this.http
      .patch<ApiList<Aseguradora>>(`${this.base}/aseguradoras/${id}`, payload)
      .pipe(
        map((r) => {
          this.invalidate();
          return r.data;
        }),
      );
  }

  deleteAseguradora(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/aseguradoras/${id}`).pipe(
      map(() => {
        this.invalidate();
      }),
    );
  }
}
