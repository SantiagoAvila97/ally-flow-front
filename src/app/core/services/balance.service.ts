import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  BalancePeriodo,
  BalanceRango,
  BalanceResumen,
  BalanceTecnicoResumen,
} from '../models/balance.model';

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/balance`;

  getResumen(rango: BalanceRango | BalancePeriodo = 'all'): Observable<BalanceResumen> {
    const params = this.toParams(rango);
    return this.http
      .get<ApiList<BalanceResumen>>(this.base, { params })
      .pipe(map((r) => r.data));
  }

  getResumenTecnico(
    rango: BalanceRango | BalancePeriodo = 'all',
  ): Observable<BalanceTecnicoResumen> {
    const params = this.toParams(rango);
    return this.http
      .get<ApiList<BalanceTecnicoResumen>>(`${this.base}/tecnico`, { params })
      .pipe(map((r) => r.data));
  }

  private toParams(rango: BalanceRango | BalancePeriodo): Record<string, string> {
    if (typeof rango === 'string') return { periodo: rango };
    const params: Record<string, string> = { periodo: rango.periodo };
    if (rango.desde) params['desde'] = rango.desde;
    if (rango.hasta) params['hasta'] = rango.hasta;
    return params;
  }
}
