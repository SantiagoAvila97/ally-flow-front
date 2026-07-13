import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideArrowUp,
  LucideArrowUpDown,
  LucideBanknote,
  LucideChevronRight,
  LucideClock,
  LucideInbox,
  LucideLayers,
  LucideSend,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { BalanceService } from '../../core/services/balance.service';
import type {
  BalancePeriodo,
  BalanceResumen,
} from '../../core/models/balance.model';
import type { EstadoCaso } from '../../core/models/caso.model';
import { labelEstadoCaso } from '../../core/labels/estado-caso';
import { SkeletonComponent } from '../../shared/skeleton.component';

type AsegSortCol = 'nombre' | 'casos' | 'pendienteEnviarCobro' | 'pendientePago' | 'ingresoCobrado';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    NgClass,
    RouterLink,
    LucideBanknote,
    LucideClock,
    LucideSend,
    LucideInbox,
    LucideLayers,
    LucideArrowRight,
    LucideArrowUp,
    LucideArrowDown,
    LucideArrowUpDown,
    LucideChevronRight,
    SkeletonComponent,
  ],
  template: `
    <main class="mx-auto max-w-6xl px-6 py-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-brand-ink">Balance general</h1>
          <p class="mt-1 max-w-2xl text-brand-soft/80">
            Dinero y tickets de {{ auth.currentUser?.empresaNombre }}: qué falta facturar,
            qué facturas están sin pagar, y qué ya está pagado.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @for (p of periodos; track p.id) {
            <button
              type="button"
              class="period-chip"
              [class.period-active]="periodo() === p.id"
              (click)="cambiarPeriodo(p.id)"
            >
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <a routerLink="/home" [queryParams]="fromHere" class="link-chip">
          <svg lucideInbox [size]="14"></svg>
          Bandeja
        </a>
        <a routerLink="/admin" [queryParams]="fromHere" class="link-chip">
          <svg lucideLayers [size]="14"></svg>
          Admin
        </a>
      </div>

      @if (loading()) {
        <app-skeleton variant="balance" />
      } @else if (error()) {
        <p class="mt-8 rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
      } @else {
        @if (data(); as d) {
        <!-- 3 bloques claros para la empresa -->
        <div class="mt-8 grid gap-4 lg:grid-cols-3">
          <article class="kpi-card kpi-enviar">
            <div class="flex items-start justify-between gap-2">
              <p class="kpi-label">Por facturar</p>
              <span class="kpi-icon">
                <svg lucideSend [size]="18"></svg>
              </span>
            </div>
            <p class="kpi-value">{{ d.totales.pendienteEnviarCobro | number: '1.0-0' }}</p>
            <p class="kpi-hint">
              {{ d.totales.casosPendienteEnviarCobro }} ticket(s) · visita lista, falta armar la factura
            </p>
            <a
              routerLink="/home"
              [queryParams]="{ estado: 'PendienteDocumentoCobro', returnTo: '/balance' }"
              class="kpi-link"
            >
              Ver en bandeja
              <svg lucideArrowRight [size]="12"></svg>
            </a>
          </article>

          <article class="kpi-card kpi-pendiente">
            <div class="flex items-start justify-between gap-2">
              <p class="kpi-label">Facturas sin pagar</p>
              <span class="kpi-icon">
                <svg lucideClock [size]="18"></svg>
              </span>
            </div>
            <p class="kpi-value">{{ d.totales.pendientePago | number: '1.0-0' }}</p>
            <p class="kpi-hint">
              {{ d.totales.casosPendientePago }} ticket(s) · espera OK aseguradora o el pago
            </p>
            <a
              routerLink="/home"
              [queryParams]="{ vista: 'nos-deben', returnTo: '/balance' }"
              class="kpi-link"
            >
              Ver en bandeja
              <svg lucideArrowRight [size]="12"></svg>
            </a>
          </article>

          <article class="kpi-card kpi-cobrado">
            <div class="flex items-start justify-between gap-2">
              <p class="kpi-label">Pagadas</p>
              <span class="kpi-icon">
                <svg lucideBanknote [size]="18"></svg>
              </span>
            </div>
            <p class="kpi-value">{{ d.totales.ingresosCobrados | number: '1.0-0' }}</p>
            <p class="kpi-hint">{{ d.totales.casosCobrados }} ticket(s) ya pagados</p>
            <a
              routerLink="/home"
              [queryParams]="{ estado: 'Cobrado', returnTo: '/balance' }"
              class="kpi-link"
            >
              Ver en bandeja
              <svg lucideArrowRight [size]="12"></svg>
            </a>
          </article>
        </div>

        @if (d.totales.casosEnOperacion > 0) {
          <p class="mt-4 text-sm text-brand-soft">
            Además hay
            <strong class="text-brand-ink">{{ d.totales.casosEnOperacion }}</strong>
            ticket(s) aún en campo (por asignar / en visita), sin factura.
          </p>
        }

        <!-- Por aseguradora -->
        <section class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div class="border-b border-slate-100 px-4 py-3">
            <h2 class="font-semibold text-brand-ink">Por aseguradora</h2>
            <p class="mt-0.5 text-sm text-brand-soft/80">
              Cuánto ya cobraste (pagado) y cuánto sigue pendiente con cada aseguradora.
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead class="bg-surface-muted/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-2.5 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="asegSortCol() === 'nombre'" (click)="toggleAsegSort('nombre')">
                      Aseguradora
                      @if (asegSortCol() === 'nombre' && asegSortDir() === 'asc') {
                        <svg lucideArrowUp [size]="12"></svg>
                      } @else if (asegSortCol() === 'nombre' && asegSortDir() === 'desc') {
                        <svg lucideArrowDown [size]="12"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-2.5 font-semibold text-right">
                    <button type="button" class="th-sort ml-auto" [class.th-sort-active]="asegSortCol() === 'casos'" (click)="toggleAsegSort('casos')">
                      Tickets
                      @if (asegSortCol() === 'casos' && asegSortDir() === 'asc') {
                        <svg lucideArrowUp [size]="12"></svg>
                      } @else if (asegSortCol() === 'casos' && asegSortDir() === 'desc') {
                        <svg lucideArrowDown [size]="12"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-2.5 font-semibold text-right">
                    <button type="button" class="th-sort ml-auto" [class.th-sort-active]="asegSortCol() === 'pendienteEnviarCobro'" (click)="toggleAsegSort('pendienteEnviarCobro')">
                      Por facturar
                      @if (asegSortCol() === 'pendienteEnviarCobro' && asegSortDir() === 'asc') {
                        <svg lucideArrowUp [size]="12"></svg>
                      } @else if (asegSortCol() === 'pendienteEnviarCobro' && asegSortDir() === 'desc') {
                        <svg lucideArrowDown [size]="12"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-2.5 font-semibold text-right">
                    <button type="button" class="th-sort ml-auto" [class.th-sort-active]="asegSortCol() === 'pendientePago'" (click)="toggleAsegSort('pendientePago')">
                      Sin pagar
                      @if (asegSortCol() === 'pendientePago' && asegSortDir() === 'asc') {
                        <svg lucideArrowUp [size]="12"></svg>
                      } @else if (asegSortCol() === 'pendientePago' && asegSortDir() === 'desc') {
                        <svg lucideArrowDown [size]="12"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-2.5 font-semibold text-right">
                    <button type="button" class="th-sort ml-auto" [class.th-sort-active]="asegSortCol() === 'ingresoCobrado'" (click)="toggleAsegSort('ingresoCobrado')">
                      Pagado
                      @if (asegSortCol() === 'ingresoCobrado' && asegSortDir() === 'asc') {
                        <svg lucideArrowUp [size]="12"></svg>
                      } @else if (asegSortCol() === 'ingresoCobrado' && asegSortDir() === 'desc') {
                        <svg lucideArrowDown [size]="12"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (row of porAseguradoraSorted(); track row.nombre) {
                  <tr class="border-t border-slate-100">
                    <td class="px-4 py-2.5 font-medium text-brand-ink">{{ row.nombre }}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums text-brand-soft">{{ row.casos }}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums text-enviar">
                      {{ row.pendienteEnviarCobro | number: '1.0-0' }}
                    </td>
                    <td class="px-4 py-2.5 text-right tabular-nums text-deben">
                      {{ row.pendientePago | number: '1.0-0' }}
                    </td>
                    <td class="px-4 py-2.5 text-right tabular-nums font-semibold text-cobrado">
                      {{ row.ingresoCobrado | number: '1.0-0' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-4 py-6 text-center text-slate-500">Sin datos en el periodo.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Listas de tickets -->
        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <section class="list-card list-enviar">
            <div class="list-head">
              <div class="flex items-center gap-2.5">
                <span class="list-icon">
                  <svg lucideSend [size]="15"></svg>
                </span>
                <div>
                  <h2 class="font-semibold text-brand-ink">Por facturar</h2>
                  <p class="mt-0.5 text-xs text-brand-soft">Falta armar la factura</p>
                </div>
              </div>
            </div>
            <ul class="divide-y divide-slate-100">
              @for (c of d.casosPendienteEnviar; track c.id) {
                <li>
                  <a
                    [routerLink]="['/casos', c.id]"
                    [queryParams]="fromHere"
                    class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/80"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium text-brand-ink">{{ c.titulo }}</p>
                      <p class="mt-0.5 text-xs text-slate-500">{{ c.numeroAseguradora }} · {{ c.aseguradora }}</p>
                    </div>
                    <p class="shrink-0 font-semibold tabular-nums text-enviar">
                      {{ c.ingreso | number: '1.0-0' }}
                    </p>
                    <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                  </a>
                </li>
              } @empty {
                <li class="px-4 py-8 text-center text-sm text-slate-500">Nada por facturar.</li>
              }
            </ul>
          </section>

          <section class="list-card list-deben">
            <div class="list-head">
              <div class="flex items-center gap-2.5">
                <span class="list-icon">
                  <svg lucideClock [size]="15"></svg>
                </span>
                <div>
                  <h2 class="font-semibold text-brand-ink">Facturas sin pagar</h2>
                  <p class="mt-0.5 text-xs text-brand-soft">Espera OK aseguradora o el pago</p>
                </div>
              </div>
            </div>
            <ul class="divide-y divide-slate-100">
              @for (c of d.casosPendientePago; track c.id) {
                <li>
                  <a
                    [routerLink]="['/casos', c.id]"
                    [queryParams]="fromHere"
                    class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/80"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium text-brand-ink">{{ c.titulo }}</p>
                      <p class="mt-0.5 text-xs text-slate-500">{{ c.numeroAseguradora }} · {{ c.aseguradora }}</p>
                      <span class="badge mt-1.5" [ngClass]="estadoClass(c.estado)">{{ labelEstado(c.estado) }}</span>
                    </div>
                    <p class="shrink-0 font-semibold tabular-nums text-deben">
                      {{ c.ingreso | number: '1.0-0' }}
                    </p>
                    <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                  </a>
                </li>
              } @empty {
                <li class="px-4 py-8 text-center text-sm text-slate-500">Ninguna factura sin pagar en este periodo.</li>
              }
            </ul>
          </section>

          <section class="list-card list-cobrado">
            <div class="list-head">
              <div class="flex items-center gap-2.5">
                <span class="list-icon">
                  <svg lucideBanknote [size]="15"></svg>
                </span>
                <div>
                  <h2 class="font-semibold text-brand-ink">Pagadas recientes</h2>
                  <p class="mt-0.5 text-xs text-brand-soft">Ya pagadas</p>
                </div>
              </div>
            </div>
            <ul class="divide-y divide-slate-100">
              @for (c of d.cobradosRecientes; track c.id) {
                <li>
                  <a
                    [routerLink]="['/casos', c.id]"
                    [queryParams]="fromHere"
                    class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/80"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium text-brand-ink">{{ c.titulo }}</p>
                      <p class="mt-0.5 text-xs text-slate-500">
                        {{ c.aseguradora }} · {{ c.updatedAt | date: 'dd/MM/yyyy' }}
                      </p>
                    </div>
                    <p class="shrink-0 font-semibold tabular-nums text-cobrado">
                      {{ c.ingreso | number: '1.0-0' }}
                    </p>
                    <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                  </a>
                </li>
              } @empty {
                <li class="px-4 py-8 text-center text-sm text-slate-500">Aún no hay facturas pagadas en el periodo.</li>
              }
            </ul>
          </section>
        </div>

        <p class="mt-6 text-xs text-slate-500">
          Actualizado {{ d.generadoAt | date: 'dd/MM/yyyy HH:mm' }} ·
          {{ d.totales.casosTotal }} tickets en el periodo
        </p>
        }
      }
    </main>
  `,
  styles: [
    `
      .th-sort {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font: inherit;
        font-weight: 600;
        text-transform: inherit;
        letter-spacing: inherit;
        color: inherit;
        cursor: pointer;
        border: 0;
        background: transparent;
        padding: 0;
      }
      .th-sort:hover {
        color: var(--brand-ink);
      }
      .th-sort-active {
        color: var(--accent);
      }
      .period-chip {
        border-radius: 9999px;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.35rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--brand-soft);
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }
      .period-chip:hover {
        background: var(--surface-muted);
      }
      .period-active {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
      }
      .link-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.35rem 0.65rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--brand-soft);
        transition: background 0.15s;
      }
      .link-chip:hover {
        background: var(--surface-muted);
        color: var(--brand-ink);
      }
      .kpi-card {
        position: relative;
        overflow: hidden;
        border-radius: 0.85rem;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 1.1rem 1.2rem 1.15rem 1.3rem;
        box-shadow: 0 10px 30px -24px rgb(15 42 68 / 0.35);
      }
      .kpi-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
      }
      .kpi-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.55rem;
        flex-shrink: 0;
      }

      /* Enviar: coral suave (acción pendiente) */
      .kpi-enviar::before {
        background: #c45c26;
      }
      .kpi-enviar .kpi-label {
        color: #9a4a1f;
      }
      .kpi-enviar .kpi-value {
        color: var(--brand-ink);
      }
      .kpi-enviar .kpi-icon {
        background: #c45c26;
        color: #fff;
      }
      .kpi-enviar .kpi-link {
        color: #c45c26;
      }

      /* Nos deben: azul acción de la marca */
      .kpi-pendiente::before {
        background: var(--action);
      }
      .kpi-pendiente .kpi-label {
        color: var(--action-hover);
      }
      .kpi-pendiente .kpi-value {
        color: var(--brand-ink);
      }
      .kpi-pendiente .kpi-icon {
        background: var(--action);
        color: #fff;
      }
      .kpi-pendiente .kpi-link {
        color: var(--action);
      }

      /* Cobrado: teal accent de la marca */
      .kpi-cobrado::before {
        background: var(--accent);
      }
      .kpi-cobrado .kpi-label {
        color: #0f766e;
      }
      .kpi-cobrado .kpi-value {
        color: var(--brand-ink);
      }
      .kpi-cobrado .kpi-icon {
        background: var(--accent);
        color: #fff;
      }
      .kpi-cobrado .kpi-link {
        color: var(--accent);
      }

      .kpi-label {
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .kpi-value {
        margin-top: 0.4rem;
        font-size: 1.75rem;
        font-weight: 800;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }
      .kpi-hint {
        margin-top: 0.4rem;
        font-size: 0.75rem;
        color: #64748b;
      }
      .kpi-link {
        margin-top: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .kpi-link:hover {
        text-decoration: underline;
      }

      .text-enviar {
        color: #c45c26;
      }
      .text-deben {
        color: var(--action);
      }
      .text-cobrado {
        color: var(--accent);
      }

      .list-card {
        overflow: hidden;
        border-radius: 0.85rem;
        border: 1px solid #e2e8f0;
        background: white;
        box-shadow: 0 10px 30px -24px rgb(15 42 68 / 0.35);
      }
      .list-head {
        border-bottom: 1px solid #f1f5f9;
        background: var(--surface);
        padding: 0.75rem 1rem;
      }
      .list-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.85rem;
        height: 1.85rem;
        border-radius: 0.45rem;
        flex-shrink: 0;
        color: #fff;
      }
      .list-enviar .list-icon {
        background: #c45c26;
      }
      .list-deben .list-icon {
        background: var(--action);
      }
      .list-cobrado .list-icon {
        background: var(--accent);
      }
    `,
  ],
})
export class BalanceComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly balanceService = inject(BalanceService);

  /** Para que Bandeja / Costos / detalle puedan volver aquí. */
  readonly fromHere = { returnTo: '/balance' };

  readonly periodo = signal<BalancePeriodo>('all');
  readonly data = signal<BalanceResumen | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly asegSortCol = signal<AsegSortCol>('ingresoCobrado');
  readonly asegSortDir = signal<SortDir>('desc');

  readonly porAseguradoraSorted = computed(() => {
    const rows = this.data()?.porAseguradora ?? [];
    const col = this.asegSortCol();
    const dir = this.asegSortDir() === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (col === 'nombre') {
        cmp = a.nombre.localeCompare(b.nombre, 'es');
      } else {
        cmp = (a[col] as number) - (b[col] as number);
      }
      return cmp * dir;
    });
  });

  readonly periodos: { id: BalancePeriodo; label: string }[] = [
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: '90d', label: '90 días' },
    { id: 'all', label: 'Todo' },
  ];

  ngOnInit(): void {
    this.load();
  }

  cambiarPeriodo(p: BalancePeriodo): void {
    this.periodo.set(p);
    this.load();
  }

  toggleAsegSort(col: AsegSortCol): void {
    if (this.asegSortCol() === col) {
      this.asegSortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.asegSortCol.set(col);
      this.asegSortDir.set(col === 'nombre' ? 'asc' : 'desc');
    }
  }

  labelEstado(e: EstadoCaso): string {
    return labelEstadoCaso(e);
  }

  estadoClass(estado: EstadoCaso): string {
    switch (estado) {
      case 'PendienteConfirmacionAsegurado':
        return 'bg-blue-100 text-blue-900';
      case 'PendienteRecepcionPago':
        return 'bg-teal-100 text-teal-900';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.balanceService.getResumen(this.periodo()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar el balance');
      },
    });
  }
}
