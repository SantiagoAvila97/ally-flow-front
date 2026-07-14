import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideArrowUp,
  LucideArrowUpDown,
  LucideBanknote,
  LucideChevronLeft,
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
  BalanceRango,
  BalanceResumen,
  BalanceTecnicoResumen,
} from '../../core/models/balance.model';
import type { EstadoCaso } from '../../core/models/caso.model';
import { labelEstadoCaso } from '../../core/labels/estado-caso';
import { CopPipe } from '../../shared/cop.pipe';
import { SkeletonComponent } from '../../shared/skeleton.component';

type AsegSortCol = 'nombre' | 'casos' | 'pendienteEnviarCobro' | 'pendientePago' | 'ingresoCobrado';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    DatePipe,
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
    LucideChevronLeft,
    LucideChevronRight,
    SkeletonComponent,
    CopPipe,
  ],
  template: `
    <main class="mx-auto max-w-6xl px-6 py-8">
      @if (isTecnico()) {
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div class="min-w-0">
            <h1 class="text-3xl font-semibold text-brand-ink">Mis pagos</h1>
            <p class="mt-1 max-w-xl text-brand-soft/80">
              Casos que cerraste en el periodo - el monto a pagar no depende del cobro del cliente.
            </p>
          </div>
          <div class="flex flex-col items-stretch gap-3 justify-self-start lg:justify-self-end">
            <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              @for (p of periodosTech; track p.id) {
                <button
                  type="button"
                  class="period-chip"
                  [class.period-active]="periodo() === p.id && !usaRangoCustom()"
                  (click)="cambiarPeriodo(p.id)"
                >
                  {{ p.label }}
                </button>
              }
            </div>
            <div class="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
              <label class="block text-xs font-medium text-slate-500">
                Desde
                <input
                  type="date"
                  class="mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  [value]="fechaDesde()"
                  (change)="onFechaDesde($any($event.target).value)"
                />
              </label>
              <label class="block text-xs font-medium text-slate-500">
                Hasta
                <input
                  type="date"
                  class="mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  [value]="fechaHasta()"
                  (change)="onFechaHasta($any($event.target).value)"
                />
              </label>
              @if (fechaDesde() || fechaHasta()) {
                <button type="button" class="btn-ghost !text-xs border border-slate-200" (click)="limpiarFechas()">
                  Quitar fechas
                </button>
              }
            </div>
          </div>
        </div>

        @if (loading()) {
          <app-skeleton variant="balance" />
        } @else if (error()) {
          <p class="mt-8 rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
        } @else {
          @if (techData(); as td) {
          <div class="mt-8 grid gap-4 sm:grid-cols-3">
            <article class="kpi-card kpi-cobrado">
              <p class="kpi-label">A pagar</p>
              <p class="kpi-value">{{ td.totales.aPagar | cop }}</p>
              <p class="kpi-hint">{{ td.totales.casosConPago }} caso(s) con pago definido</p>
            </article>
            <article class="kpi-card kpi-pendiente">
              <p class="kpi-label">Pendientes de liquidar</p>
              <p class="kpi-value">{{ td.totales.casosPendientes }}</p>
              <p class="kpi-hint">Aún sin monto de pago</p>
            </article>
            <article class="kpi-card kpi-enviar">
              <p class="kpi-label">Casos cerrados</p>
              <p class="kpi-value">{{ td.totales.casos }}</p>
              <p class="kpi-hint">Por fecha de cierre de visita</p>
            </article>
          </div>

          <section class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <div class="border-b border-slate-100 px-4 py-3">
              <h2 class="font-semibold text-brand-ink">Detalle</h2>
              <p class="mt-0.5 text-sm text-brand-soft/80">
                Ordenados por cuando cerraste la visita.
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[520px] text-left text-sm">
                <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <tr>
                    <th class="px-4 py-2.5 font-semibold">Caso</th>
                    <th class="px-4 py-2.5 font-semibold">Cerrado</th>
                    <th class="px-4 py-2.5 font-semibold text-right">Pago</th>
                    <th class="px-4 py-2.5 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of td.casos; track c.id) {
                    <tr class="border-t border-slate-100">
                      <td class="px-4 py-2.5">
                        <p class="font-medium text-brand-ink">{{ c.titulo }}</p>
                        <p class="text-xs text-slate-500">
                          {{ c.numeroAseguradora }} - {{ c.aseguradora }}
                        </p>
                      </td>
                      <td class="px-4 py-2.5 text-slate-600">
                        {{ c.cerradoEn ? (c.cerradoEn | date: 'dd/MM/yyyy') : '?' }}
                      </td>
                      <td class="px-4 py-2.5 text-right tabular-nums font-semibold">
                        @if (c.pagoTecnico == null) {
                          <span class="text-amber-700">Pendiente</span>
                        } @else {
                          {{ c.pagoTecnico | cop }}
                        }
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <a
                          [routerLink]="['/casos', c.id]"
                          [queryParams]="fromHere"
                          class="text-accent underline"
                          >Ver</a
                        >
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-4 py-8 text-center text-slate-500">
                        No hay visitas cerradas en el periodo.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
          }
        }
      } @else {
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div class="min-w-0">
            <h1 class="text-3xl font-semibold text-brand-ink">Balance general</h1>
            <p class="mt-1 max-w-xl text-brand-soft/80">
              Ingresos = cobro cliente. Técnicos y materiales = costo del periodo (pague o no el cliente). Utilidad de caja = solo cobrado (sin pendiente de pago) menos costos del periodo.
            </p>
          </div>
          <div class="flex flex-col items-stretch gap-3 justify-self-start lg:justify-self-end">
            <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              @for (p of periodosAdmin; track p.id) {
                <button
                  type="button"
                  class="period-chip"
                  [class.period-active]="periodo() === p.id && !usaRangoCustom()"
                  (click)="cambiarPeriodo(p.id)"
                >
                  {{ p.label }}
                </button>
              }
            </div>
            <div class="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
              <label class="block text-xs font-medium text-slate-500">
                Desde
                <input
                  type="date"
                  class="mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  [value]="fechaDesde()"
                  (change)="onFechaDesde($any($event.target).value)"
                />
              </label>
              <label class="block text-xs font-medium text-slate-500">
                Hasta
                <input
                  type="date"
                  class="mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  [value]="fechaHasta()"
                  (change)="onFechaHasta($any($event.target).value)"
                />
              </label>
              @if (fechaDesde() || fechaHasta()) {
                <button type="button" class="btn-ghost !text-xs border border-slate-200" (click)="limpiarFechas()">
                  Quitar fechas
                </button>
              }
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <a routerLink="/home" [queryParams]="fromHere" class="link-chip">
            <svg lucideInbox [size]="14"></svg>
            Bandeja
          </a>
          <a routerLink="/admin" [queryParams]="fromHere" class="link-chip">
            <svg lucideLayers [size]="14"></svg>
            Tarifas
          </a>
        </div>

        @if (loading()) {
          <app-skeleton variant="balance" />
        } @else if (error()) {
          <p class="mt-8 rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
        } @else {
          @if (data(); as d) {
            <div class="mt-8 grid gap-4 lg:grid-cols-3">
              <article class="kpi-card kpi-enviar">
                <div class="flex items-start justify-between gap-2">
                  <p class="kpi-label">Por facturar</p>
                  <span class="kpi-icon">
                    <svg lucideSend [size]="18"></svg>
                  </span>
                </div>
                <p class="kpi-value">{{ d.totales.pendienteEnviarCobro | cop }}</p>
                <p class="kpi-hint">
                  {{ d.totales.casosPendienteEnviarCobro }} ticket(s) - visita lista, falta armar la
                  factura
                </p>
                <a href="#detalle-por-facturar" class="kpi-link" (click)="scrollToDetalle($event, 'detalle-por-facturar')">
                  Ver en bandeja
                  <svg lucideArrowRight [size]="12"></svg>
                </a>
              </article>

              <article class="kpi-card kpi-pendiente">
                <div class="flex items-start justify-between gap-2">
                  <p class="kpi-label">Pendiente de pago</p>
                  <span class="kpi-icon">
                    <svg lucideClock [size]="18"></svg>
                  </span>
                </div>
                <p class="kpi-value">{{ d.totales.pendientePago | cop }}</p>
                <p class="kpi-hint">
                  {{ d.totales.casosPendientePago }} ticket(s) - espera OK cliente o el pago
                </p>
                <a href="#detalle-pendiente-pago" class="kpi-link" (click)="scrollToDetalle($event, 'detalle-pendiente-pago')">
                  Ver en bandeja
                  <svg lucideArrowRight [size]="12"></svg>
                </a>
              </article>

              <article class="kpi-card kpi-cobrado">
                <div class="flex items-start justify-between gap-2">
                  <p class="kpi-label">Pagadas (cliente)</p>
                  <span class="kpi-icon">
                    <svg lucideBanknote [size]="18"></svg>
                  </span>
                </div>
                <p class="kpi-value">{{ d.totales.ingresosCobrados | cop }}</p>
                <p class="kpi-hint">
                  {{ d.totales.casosCobrados }} ticket(s) - el cliente ya pagó
                </p>
                <a href="#detalle-pagadas" class="kpi-link" (click)="scrollToDetalle($event, 'detalle-pagadas')">
                  Ver en bandeja
                  <svg lucideArrowRight [size]="12"></svg>
                </a>
              </article>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article class="kpi-card kpi-money">
                <p class="kpi-label">Ingresos (cliente)</p>
                <p class="kpi-value kpi-value-sm">{{ d.totales.ingresosCobrados | cop }}</p>
                <p class="kpi-hint">Solo casos marcados pagados por el cliente</p>
              </article>
              <article class="kpi-card kpi-tech">
                <p class="kpi-label">Pago técnicos</p>
                <p class="kpi-value kpi-value-sm">{{ d.totales.pagoTecnicos | cop }}</p>
                <p class="kpi-hint">Costo del periodo (pague o no el cliente)</p>
              </article>
              <article class="kpi-card kpi-mats">
                <p class="kpi-label">Materiales</p>
                <p class="kpi-value kpi-value-sm">{{ d.totales.materiales | cop }}</p>
                <p class="kpi-hint">Costo del periodo (pague o no el cliente)</p>
              </article>
              <article class="kpi-card kpi-utilidad">
                <p class="kpi-label">Utilidad de caja</p>
                <p class="kpi-value kpi-value-sm">{{ d.totales.utilidadOperativa | cop }}</p>
                <p class="kpi-hint">Solo lo ya cobrado (sin pendiente de pago). Menos técnicos y materiales del periodo.</p>
              </article>
            </div>

            @if (d.totales.casosEnOperacion > 0) {
              <p class="mt-4 text-sm text-brand-soft">
                Además hay
                <strong class="text-brand-ink">{{ d.totales.casosEnOperacion }}</strong>
                ticket(s) aún en campo (por asignar / en visita), sin factura.
              </p>
            }

            <section class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div class="border-b border-slate-100 px-4 py-3">
                <h2 class="font-semibold text-brand-ink">Detalle de casos pagados</h2>
                <p class="mt-0.5 text-sm text-brand-soft/80">
                  Cada fila es un caso ya Pagado. La tarjeta de arriba es la utilidad de caja del periodo.
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-left text-sm">
                  <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <tr>
                      <th class="px-4 py-2.5 font-semibold">Caso</th>
                      <th class="px-4 py-2.5 font-semibold">Técnico</th>
                      <th class="px-4 py-2.5 font-semibold text-right">Ingreso</th>
                      <th class="px-4 py-2.5 font-semibold text-right">Pago técnico</th>
                      <th class="px-4 py-2.5 font-semibold text-right">Materiales</th>
                      <th class="px-4 py-2.5 font-semibold text-right">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of casosOperacionPage(); track row.id) {
                      <tr class="border-t border-slate-100">
                        <td class="px-4 py-2.5">
                          <a
                            [routerLink]="['/casos', row.id]"
                            [queryParams]="fromHere"
                            class="font-medium text-brand-ink underline-offset-2 hover:underline"
                          >
                            {{ row.titulo }}
                          </a>
                          <p class="text-xs text-slate-500">
                            {{ row.numeroAseguradora }} - {{ row.aseguradora }}
                          </p>
                        </td>
                        <td class="px-4 py-2.5 text-brand-soft">
                          {{ row.tecnicoNombre ?? '-' }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums">
                          {{ row.ingreso | cop }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums">
                          @if (row.pagoTecnico == null) {
                            <span class="text-amber-700">Pendiente</span>
                          } @else {
                            {{ row.pagoTecnico | cop }}
                          }
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums">
                          {{ row.materiales | cop }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums font-semibold text-cobrado">
                          @if (row.utilidad == null) {
                            <span class="font-normal text-amber-700">Sin liquidar</span>
                          } @else {
                            {{ row.utilidad | cop }}
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                          No hay casos Pagados (cliente) en el periodo.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              @if (utilPageMeta(); as pm) {
                @if (pm.total > pm.pageSize) {
                  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                    <p class="text-sm text-slate-500">
                      {{ utilRangoLabel() }} de {{ pm.total }}
                    </p>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="btn-ghost border border-slate-200 !px-3 !py-1.5"
                        [disabled]="pm.page <= 1"
                        (click)="goUtilPage(pm.page - 1)"
                      >
                        <svg lucideChevronLeft [size]="16"></svg>
                        Anterior
                      </button>
                      <span class="text-sm font-medium text-brand-ink tabular-nums">
                        {{ pm.page }} / {{ pm.totalPages }}
                      </span>
                      <button
                        type="button"
                        class="btn-ghost border border-slate-200 !px-3 !py-1.5"
                        [disabled]="pm.page >= pm.totalPages"
                        (click)="goUtilPage(pm.page + 1)"
                      >
                        Siguiente
                        <svg lucideChevronRight [size]="16"></svg>
                      </button>
                    </div>
                  </div>
                }
              }
            </section>

            @if (d.porTecnico.length) {
              <section class="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
                <div class="border-b border-slate-100 px-4 py-3">
                  <h2 class="font-semibold text-brand-ink">Por técnico</h2>
                  <p class="mt-0.5 text-sm text-brand-soft/80">Suma a pagar en el periodo.</p>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[420px] text-left text-sm">
                    <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                      <tr>
                        <th class="px-4 py-2.5 font-semibold">Técnico</th>
                        <th class="px-4 py-2.5 font-semibold text-right">Casos</th>
                        <th class="px-4 py-2.5 font-semibold text-right">A pagar</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (t of d.porTecnico; track t.tecnicoId) {
                        <tr class="border-t border-slate-100">
                          <td class="px-4 py-2.5 font-medium text-brand-ink">
                            {{ t.tecnicoNombre }}
                          </td>
                          <td class="px-4 py-2.5 text-right tabular-nums">{{ t.casos }}</td>
                          <td class="px-4 py-2.5 text-right tabular-nums font-semibold">
                            {{ t.aPagar | cop }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            <section class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div class="border-b border-slate-100 px-4 py-3">
                <h2 class="font-semibold text-brand-ink">Por cliente</h2>
                <p class="mt-0.5 text-sm text-brand-soft/80">
                  Cuánto ya cobraste (pagado) y cuánto sigue pendiente con cada cliente.
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[560px] text-left text-sm">
                  <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <tr>
                      <th class="px-4 py-2.5 font-semibold">
                        <button
                          type="button"
                          class="th-sort"
                          [class.th-sort-active]="asegSortCol() === 'nombre'"
                          (click)="toggleAsegSort('nombre')"
                        >
                          Cliente
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
                        <button
                          type="button"
                          class="th-sort ml-auto"
                          [class.th-sort-active]="asegSortCol() === 'casos'"
                          (click)="toggleAsegSort('casos')"
                        >
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
                        <button
                          type="button"
                          class="th-sort ml-auto"
                          [class.th-sort-active]="asegSortCol() === 'pendienteEnviarCobro'"
                          (click)="toggleAsegSort('pendienteEnviarCobro')"
                        >
                          Por facturar
                          @if (
                            asegSortCol() === 'pendienteEnviarCobro' && asegSortDir() === 'asc'
                          ) {
                            <svg lucideArrowUp [size]="12"></svg>
                          } @else if (
                            asegSortCol() === 'pendienteEnviarCobro' && asegSortDir() === 'desc'
                          ) {
                            <svg lucideArrowDown [size]="12"></svg>
                          } @else {
                            <svg lucideArrowUpDown [size]="12" class="opacity-50"></svg>
                          }
                        </button>
                      </th>
                      <th class="px-4 py-2.5 font-semibold text-right">
                        <button
                          type="button"
                          class="th-sort ml-auto"
                          [class.th-sort-active]="asegSortCol() === 'pendientePago'"
                          (click)="toggleAsegSort('pendientePago')"
                        >
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
                        <button
                          type="button"
                          class="th-sort ml-auto"
                          [class.th-sort-active]="asegSortCol() === 'ingresoCobrado'"
                          (click)="toggleAsegSort('ingresoCobrado')"
                        >
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
                        <td class="px-4 py-2.5 text-right tabular-nums text-brand-soft">
                          {{ row.casos }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums text-enviar">
                          {{ row.pendienteEnviarCobro | cop }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums text-deben">
                          {{ row.pendientePago | cop }}
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums font-semibold text-cobrado">
                          {{ row.ingresoCobrado | cop }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="px-4 py-6 text-center text-slate-500">
                          Sin datos en el periodo.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <div class="mt-8 grid gap-6 lg:grid-cols-3">
              <section id="detalle-por-facturar" class="list-card list-enviar scroll-mt-24">
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
                          <p class="mt-0.5 text-xs text-slate-500">
                            {{ c.numeroAseguradora }} - {{ c.aseguradora }}
                          </p>
                        </div>
                        <p class="shrink-0 font-semibold tabular-nums text-enviar">
                          {{ c.ingreso | cop }}
                        </p>
                        <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                      </a>
                    </li>
                  } @empty {
                    <li class="px-4 py-8 text-center text-sm text-slate-500">Nada por facturar.</li>
                  }
                </ul>
              </section>

              <section id="detalle-pendiente-pago" class="list-card list-deben scroll-mt-24">
                <div class="list-head">
                  <div class="flex items-center gap-2.5">
                    <span class="list-icon">
                      <svg lucideClock [size]="15"></svg>
                    </span>
                    <div>
                      <h2 class="font-semibold text-brand-ink">Pendiente de pago</h2>
                      <p class="mt-0.5 text-xs text-brand-soft">Espera OK cliente o el pago</p>
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
                          <p class="mt-0.5 text-xs text-slate-500">
                            {{ c.numeroAseguradora }} - {{ c.aseguradora }}
                          </p>
                          <span class="badge mt-1.5" [ngClass]="estadoClass(c.estado)">{{
                            labelEstado(c.estado)
                          }}</span>
                        </div>
                        <p class="shrink-0 font-semibold tabular-nums text-deben">
                          {{ c.ingreso | cop }}
                        </p>
                        <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                      </a>
                    </li>
                  } @empty {
                    <li class="px-4 py-8 text-center text-sm text-slate-500">
                      Nada pendiente de pago en este periodo.
                    </li>
                  }
                </ul>
              </section>

              <section id="detalle-pagadas" class="list-card list-cobrado scroll-mt-24">
                <div class="list-head">
                  <div class="flex items-center gap-2.5">
                    <span class="list-icon">
                      <svg lucideBanknote [size]="15"></svg>
                    </span>
                    <div>
                      <h2 class="font-semibold text-brand-ink">Pagadas (cliente)</h2>
                      <p class="mt-0.5 text-xs text-brand-soft">El cliente ya pagó</p>
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
                            {{ c.aseguradora }} - {{ c.updatedAt | date: 'dd/MM/yyyy' }}
                          </p>
                        </div>
                        <p class="shrink-0 font-semibold tabular-nums text-cobrado">
                          {{ c.ingreso | cop }}
                        </p>
                        <svg lucideChevronRight [size]="16" class="shrink-0 text-slate-400"></svg>
                      </a>
                    </li>
                  } @empty {
                    <li class="px-4 py-8 text-center text-sm text-slate-500">
                      Aún no hay facturas pagadas en el periodo.
                    </li>
                  }
                </ul>
              </section>
            </div>

            <p class="mt-6 text-xs text-slate-500">
              Actualizado {{ d.generadoAt | date: 'dd/MM/yyyy HH:mm' }} 
              {{ d.totales.casosTotal }} tickets en el periodo
            </p>
          }
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
        transition:
          background 0.15s,
          border-color 0.15s,
          color 0.15s;
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

      /* Fila de dinero: colores distintos al embudo de arriba */
      .kpi-money::before {
        background: #334155;
      }
      .kpi-money .kpi-label {
        color: #334155;
      }
      .kpi-money .kpi-value {
        color: var(--brand-ink);
      }

      .kpi-tech::before {
        background: #b45309;
      }
      .kpi-tech .kpi-label {
        color: #92400e;
      }
      .kpi-tech .kpi-value {
        color: var(--brand-ink);
      }

      .kpi-mats::before {
        background: #57534e;
      }
      .kpi-mats .kpi-label {
        color: #44403c;
      }
      .kpi-mats .kpi-value {
        color: var(--brand-ink);
      }

      .kpi-utilidad::before {
        background: #065f46;
      }
      .kpi-utilidad .kpi-label {
        color: #065f46;
      }
      .kpi-utilidad .kpi-value {
        color: var(--brand-ink);
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
      .kpi-value-sm {
        font-size: 1.35rem;
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
        background: #fff;
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

  readonly fromHere = { returnTo: '/balance' };

  readonly periodo = signal<BalancePeriodo>('90d');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly usaRangoCustom = computed(() => !!(this.fechaDesde() || this.fechaHasta()));
  readonly data = signal<BalanceResumen | null>(null);
  readonly techData = signal<BalanceTecnicoResumen | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly asegSortCol = signal<AsegSortCol>('ingresoCobrado');
  readonly asegSortDir = signal<SortDir>('desc');
  readonly utilPage = signal(1);
  readonly utilPageSize = 20;

  readonly casosOperacionPage = computed(() => {
    const rows = this.data()?.casosOperacion ?? [];
    const start = (this.utilPage() - 1) * this.utilPageSize;
    return rows.slice(start, start + this.utilPageSize);
  });

  readonly utilPageMeta = computed(() => {
    const total = this.data()?.casosOperacion.length ?? 0;
    const pageSize = this.utilPageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(this.utilPage(), totalPages);
    return { page, totalPages, total, pageSize };
  });


  readonly isTecnico = computed(() => this.auth.currentUser?.role === 'TECNICO');

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

  /** Admin: por defecto 90 días de calendario rolling. */
  readonly periodosAdmin: { id: BalancePeriodo; label: string }[] = [
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: '90d', label: '90 días' },
    { id: 'all', label: 'Todo' },
  ];

  /** Técnico: por defecto mes en curso. */
  readonly periodosTech: { id: BalancePeriodo; label: string }[] = [
    { id: 'month', label: 'Este mes' },
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: '90d', label: '90 días' },
    { id: 'all', label: 'Todo' },
  ];

  ngOnInit(): void {
    this.periodo.set(this.isTecnico() ? 'month' : '90d');
    this.load();
  }

  cambiarPeriodo(p: BalancePeriodo): void {
    this.periodo.set(p);
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.load();
  }

  onFechaDesde(v: string): void {
    this.fechaDesde.set(v);
    this.periodo.set('custom');
    this.load();
  }

  onFechaHasta(v: string): void {
    this.fechaHasta.set(v);
    this.periodo.set('custom');
    this.load();
  }

  limpiarFechas(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.periodo.set(this.isTecnico() ? 'month' : '90d');
    this.load();
  }

  private rangoActual(): BalanceRango {
    const desde = this.fechaDesde() || null;
    const hasta = this.fechaHasta() || null;
    if (desde || hasta) {
      return { periodo: 'custom', desde, hasta };
    }
    return { periodo: this.periodo() };
  }

  toggleAsegSort(col: AsegSortCol): void {
    if (this.asegSortCol() === col) {
      this.asegSortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.asegSortCol.set(col);
      this.asegSortDir.set(col === 'nombre' ? 'asc' : 'desc');
    }
  }

  goUtilPage(page: number): void {
    const meta = this.utilPageMeta();
    const next = Math.max(1, Math.min(page, meta.totalPages));
    this.utilPage.set(next);
  }

  utilRangoLabel(): string {
    const m = this.utilPageMeta();
    if (m.total === 0) return '0';
    const from = (m.page - 1) * m.pageSize + 1;
    const to = Math.min(m.page * m.pageSize, m.total);
    return from + '-' + to;
  }

  scrollToDetalle(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (this.isTecnico()) {
      this.balanceService.getResumenTecnico(this.rangoActual()).subscribe({
        next: (res) => {
          this.techData.set(res);
          this.data.set(null);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo cargar el balance');
        },
      });
      return;
    }

    this.balanceService.getResumen(this.rangoActual()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.techData.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar el balance');
      },
    });
  }
}
