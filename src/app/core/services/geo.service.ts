import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GeoResult {
  displayName: string;
  lat: number | null;
  lon: number | null;
  mapEmbedUrl: string;
  mapLink: string;
  aproximada?: boolean;
}

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly http = inject(HttpClient);

  search(direccion: string, ciudad: string): Observable<GeoResult> {
    return this.http
      .get<ApiList<GeoResult>>(`${environment.apiUrl}/geo/search`, {
        params: { direccion, ciudad },
      })
      .pipe(map((r) => r.data));
  }
}
