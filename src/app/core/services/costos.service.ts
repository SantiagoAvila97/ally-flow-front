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

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CostosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/costos`;

  listTree(): Observable<CategoriaConItems[]> {
    return this.http.get<ApiList<CategoriaConItems[]>>(this.base).pipe(map((r) => r.data));
  }

  createCategoria(payload: CrearCategoriaPayload): Observable<CategoriaCosto> {
    return this.http
      .post<ApiList<CategoriaCosto>>(`${this.base}/categorias`, payload)
      .pipe(map((r) => r.data));
  }

  updateCategoria(id: string, payload: ActualizarCategoriaPayload): Observable<CategoriaCosto> {
    return this.http
      .patch<ApiList<CategoriaCosto>>(`${this.base}/categorias/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteCategoria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categorias/${id}`);
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

  getPlantillaPdf(): Observable<PlantillaPdfCobro> {
    return this.http
      .get<ApiList<PlantillaPdfCobro>>(`${this.base}/plantilla-pdf`)
      .pipe(map((r) => r.data));
  }

  updatePlantillaPdf(payload: ActualizarPlantillaPdfPayload): Observable<PlantillaPdfCobro> {
    return this.http
      .patch<ApiList<PlantillaPdfCobro>>(`${this.base}/plantilla-pdf`, payload)
      .pipe(map((r) => r.data));
  }
}
