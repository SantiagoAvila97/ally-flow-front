import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Caso, CompletarCasoPayload, CrearCasoPayload, LineaCobro, TecnicoOption } from '../models/caso.model';
import type { ListCasosParams, PaginatedResult } from '../models/pagination.model';
import { PAGE_SIZE_DEFAULT } from '../models/pagination.model';

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CasosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/casos`;

  /** Técnicos de la empresa: cache de sesión (cambia poco). */
  private tecnicos$?: Observable<TecnicoOption[]>;

  list(params: ListCasosParams = {}): Observable<PaginatedResult<Caso>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? PAGE_SIZE_DEFAULT));

    const optional: (keyof ListCasosParams)[] = [
      'q',
      'estado',
      'categoria',
      'ciudad',
      'aseguradora',
      'vista',
      'sort',
      'sortDir',
    ];
    for (const key of optional) {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    }

    return this.http.get<PaginatedResult<Caso>>(this.base, { params: httpParams });
  }

  getById(id: string): Observable<Caso> {
    return this.http.get<ApiList<Caso>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  getCategorias(): Observable<string[]> {
    return this.http
      .get<ApiList<string[]>>(`${this.base}/meta/categorias`)
      .pipe(map((r) => r.data));
  }

  getTecnicos(): Observable<TecnicoOption[]> {
    if (!this.tecnicos$) {
      this.tecnicos$ = this.http
        .get<ApiList<TecnicoOption[]>>(`${this.base}/meta/tecnicos`)
        .pipe(
          map((r) => r.data),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.tecnicos$;
  }

  /** Limpiar meta en logout (empresa / usuario distinto). */
  invalidateMetaCache(): void {
    this.tecnicos$ = undefined;
  }

  create(payload: CrearCasoPayload): Observable<Caso> {
    return this.http.post<ApiList<Caso>>(this.base, payload).pipe(map((r) => r.data));
  }

  asignar(id: string, tecnicoId: string): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/asignar`, { tecnicoId })
      .pipe(map((r) => r.data));
  }

  iniciar(id: string): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/iniciar`, {})
      .pipe(map((r) => r.data));
  }

  addFoto(id: string, url: string): Observable<Caso> {
    return this.http
      .post<ApiList<Caso>>(`${this.base}/${id}/fotos`, { url })
      .pipe(map((r) => r.data));
  }

  documentar(id: string, nota: string): Observable<Caso> {
    return this.http
      .post<ApiList<Caso>>(`${this.base}/${id}/documentar`, { nota })
      .pipe(map((r) => r.data));
  }

  completar(id: string, payload: CompletarCasoPayload): Observable<Caso> {
    return this.http
      .post<ApiList<Caso>>(`${this.base}/${id}/completar`, payload)
      .pipe(map((r) => r.data));
  }

  cobrar(id: string): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/cobrar`, {})
      .pipe(map((r) => r.data));
  }

  /** Autosave silencioso de líneas de cobro. */
  setLineasCobro(id: string, lineas: LineaCobro[]): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/lineas-cobro`, { lineas })
      .pipe(map((r) => r.data));
  }

  enviarDocumento(id: string): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/enviar-documento`, {})
      .pipe(map((r) => r.data));
  }

  confirmarAsegurado(id: string): Observable<Caso> {
    return this.http
      .patch<ApiList<Caso>>(`${this.base}/${id}/confirmar-asegurado`, {})
      .pipe(map((r) => r.data));
  }

  descargarDocumentoCobro(id: string, filename: string): Observable<void> {
    return this.http
      .get(`${this.base}/${id}/documento-cobro.pdf`, {
        responseType: 'blob',
      })
      .pipe(
        map((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }),
      );
  }

  abrirGarantia(id: string): Observable<Caso> {
    return this.http
      .post<ApiList<Caso>>(`${this.base}/${id}/garantia`, {})
      .pipe(map((r) => r.data));
  }
}
