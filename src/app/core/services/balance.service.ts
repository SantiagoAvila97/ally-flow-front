import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BalancePeriodo, BalanceResumen } from '../models/balance.model';

interface ApiList<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/balance`;

  getResumen(periodo: BalancePeriodo = 'all'): Observable<BalanceResumen> {
    return this.http
      .get<ApiList<BalanceResumen>>(this.base, { params: { periodo } })
      .pipe(map((r) => r.data));
  }
}
