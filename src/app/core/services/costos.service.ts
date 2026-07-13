import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ActualizarCategoriaPayload,
  ActualizarItemPayload,
  CategoriaConItems,
  CategoriaCosto,
  CrearCategoriaPayload,
  CrearItemPayload,
  ItemCosto,
  PlantillaPdfCobro,
  ActualizarPlantillaPdfPayload,
} from '../models/costo.model';
import { CatalogosService } from './catalogos.service';

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CostosService {
  private readonly http = inject(HttpClient);
  private readonly catalogos = inject(CatalogosService);
  private readonly base = `${environment.apiUrl}/costos`;

  listTree(): Observable<CategoriaConItems[]> {
    return this.http.get<ApiList<CategoriaConItems[]>>(this.base).pipe(map((r) => r.data));
  }

  createCategoria(payload: CrearCategoriaPayload): Observable<CategoriaCosto> {
    return this.http.post<ApiList<CategoriaCosto>>(`${this.base}/categorias`, payload).pipe(
      map((r) => {
        this.catalogos.invalidate();
        return r.data;
      }),
    );
  }

  updateCategoria(id: string, payload: ActualizarCategoriaPayload): Observable<CategoriaCosto> {
    return this.http.patch<ApiList<CategoriaCosto>>(`${this.base}/categorias/${id}`, payload).pipe(
      map((r) => {
        this.catalogos.invalidate();
        return r.data;
      }),
    );
  }

  deleteCategoria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categorias/${id}`).pipe(
      map(() => {
        this.catalogos.invalidate();
      }),
    );
  }

  createItem(payload: CrearItemPayload): Observable<ItemCosto> {
    return this.http
      .post<ApiList<ItemCosto>>(`${this.base}/items`, payload)
      .pipe(map((r) => r.data));
  }

  updateItem(id: string, payload: ActualizarItemPayload): Observable<ItemCosto> {
    return this.http
      .patch<ApiList<ItemCosto>>(`${this.base}/items/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/items/${id}`);
  }

  getPlantillaPdf(aseguradoraId?: string | null): Observable<PlantillaPdfCobro> {
    let params = undefined as Record<string, string> | undefined;
    if (aseguradoraId) params = { aseguradoraId };
    return this.http
      .get<ApiList<PlantillaPdfCobro>>(`${this.base}/plantilla-pdf`, { params })
      .pipe(map((r) => r.data));
  }

  listPlantillasPdf(): Observable<PlantillaPdfCobro[]> {
    return this.http
      .get<ApiList<PlantillaPdfCobro[]>>(`${this.base}/plantillas-pdf`)
      .pipe(map((r) => r.data));
  }

  updatePlantillaPdf(payload: ActualizarPlantillaPdfPayload): Observable<PlantillaPdfCobro> {
    return this.http
      .patch<ApiList<PlantillaPdfCobro>>(`${this.base}/plantilla-pdf`, payload)
      .pipe(map((r) => r.data));
  }

  deletePlantillaPdf(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/plantilla-pdf/${id}`);
  }

  /** Descarga PDF de prueba con el borrador actual (no guarda). */
  descargarPreviewPdf(
    payload: ActualizarPlantillaPdfPayload,
    filename = 'factura-cobro-prueba.pdf',
  ): Observable<void> {
    return this.http
      .post(`${this.base}/plantilla-pdf/preview.pdf`, payload, {
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
}
