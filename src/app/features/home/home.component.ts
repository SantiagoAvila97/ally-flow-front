import { DatePipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowUp,
  LucideArrowUpDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleQuestionMark,
  LucideFunnelX,
  LucidePlus,
  LucideX,
} from '@lucide/angular';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CasosService } from '../../core/services/casos.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import type { Caso, EstadoCaso, TecnicoOption } from '../../core/models/caso.model';
import { ESTADOS_CASO, ESTADOS_OCULTOS_TECNICO } from '../../core/models/caso.model';
import type { PaginationMeta } from '../../core/models/pagination.model';
import { PAGE_SIZE_DEFAULT } from '../../core/models/pagination.model';
import { labelEstadoCaso } from '../../core/labels/estado-caso';
import { flujoCasoCorto } from '../../core/labels/flujo-caso';
import { returnLabel, safeReturnTo } from '../../shared/nav-return';
import { SkeletonComponent } from '../../shared/skeleton.component';

type SortCol = 'updatedAt' | 'createdAt' | 'titulo' | 'aseguradora' | 'estado' | 'tecnico';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideArrowUp,
    LucideArrowDown,
    LucideArrowUpDown,
    LucidePlus,
    LucideFunnelX,
    LucideCircleQuestionMark,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
    SkeletonComponent,
  ],
  template: `
    <div>
      <main class="mx-auto max-w-6xl px-6 py-8">
        @if (returnTo(); as back) {
          <div class="mb-5">
            <a [routerLink]="back.path" [queryParams]="back.queryParams" class="btn-back">
              <svg lucideArrowLeft [size]="16"></svg>
              {{ back.label }}
            </a>
          </div>
        }

        @if (handoffNotice()) {
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-accent/30 bg-accent-soft/50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-brand-ink">Visita cerrada correctamente</p>
              <p class="mt-0.5 text-sm text-brand-soft">
                El caso pasó a cobranza / garantía. Ya no aparece en tu bandeja de campo.
              </p>
            </div>
            <button type="button" class="btn-ghost !text-xs border border-slate-200" (click)="handoffNotice.set(false)">
              Entendido
            </button>
          </div>
        }

        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-semibold text-brand-ink">Bandeja de entrada</h1>
            <p class="mt-1 text-brand-soft/80">{{ roleHint() }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm text-slate-500">
              @if (meta(); as m) {
                {{ rangoLabel() }} · {{ m.total }} total
              }
            </p>
            @if (canCreate()) {
              <a routerLink="/casos/nuevo" [queryParams]="casoLinkParams()" class="btn-estado">
                <svg lucidePlus [size]="16"></svg>
                Crear nuevo caso
              </a>
            }
          </div>
        </div>

        <!-- Filtros avanzados (todos los roles) -->
        @if (loading()) {
          <app-skeleton variant="bandeja-filters" />
        } @else {
        <div class="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="block sm:col-span-2 lg:col-span-2">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar
            </span>
            <input
              type="search"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Nº cliente, titular o título…"
              [ngModel]="busqueda()"
              (ngModelChange)="onBusqueda($event)"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categoría
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroCategoria()"
              (ngModelChange)="onFiltroCategoria($event)"
            >
              <option value="">Todas</option>
              @for (c of categorias(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
              <button
                type="button"
                class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent transition hover:bg-accent hover:text-white"
                title="Ver guía de estados"
                aria-label="Información de estados del flujo"
                (click)="mostrarGuiaEstados.set(true)"
              >
                <svg lucideCircleQuestionMark [size]="12"></svg>
              </button>
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroEstado()"
              (ngModelChange)="onFiltroEstado($event)"
            >
              <option value="">Todos</option>
              @for (e of estadosFiltro(); track e) {
                <option [value]="e">{{ labelEstado(e) }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ciudad
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroCiudad()"
              (ngModelChange)="onFiltroCiudad($event)"
            >
              <option value="">Todas</option>
              @for (c of ciudades(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cliente
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroAseguradora()"
              (ngModelChange)="onFiltroAseguradora($event)"
            >
              <option value="">Todas</option>
              @for (a of aseguradoras(); track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </label>

          <div class="flex items-end sm:col-span-2 lg:col-span-2">
            <button type="button" class="btn-ghost border border-slate-200" (click)="limpiarFiltros()">
              <svg lucideFunnelX [size]="15"></svg>
              Limpiar filtros
            </button>
          </div>
        </div>
        }

        <!-- Guía de estados (timeline informativa) -->
        @if (mostrarGuiaEstados()) {
          <div
            class="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/45 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guia-estados-title"
            (click)="mostrarGuiaEstados.set(false)"
          >
            <div
              class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-soft"
              (click)="$event.stopPropagation()"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 id="guia-estados-title" class="text-2xl font-semibold text-brand-ink">
                    Guía de estados
                  </h2>
                  <p class="mt-1 text-sm text-brand-soft">
                    Flujo del caso de punta a punta. Cada estado indica qué pasa y quién actúa.
                  </p>
                </div>
                <button
                  type="button"
                  class="icon-btn"
                  (click)="mostrarGuiaEstados.set(false)"
                  title="Cerrar"
                  aria-label="Cerrar"
                >
                  <svg lucideX [size]="18"></svg>
                </button>
              </div>

              <ol class="mt-6 space-y-0 border-l-2 border-slate-200 pl-6">
                @for (paso of guiaEstados; track paso.estado; let i = $index) {
                  <li class="relative pb-6 last:pb-0">
                    <span
                      class="absolute -left-[1.65rem] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow"
                      [ngClass]="estadoDotClass(paso.estado)"
                    >
                      {{ i + 1 }}
                    </span>
                    <p class="text-sm font-semibold text-brand-ink">{{ paso.titulo }}</p>
                    <p class="mt-0.5">
                      <span class="badge" [ngClass]="estadoClass(paso.estado)">{{
                        labelEstado(paso.estado)
                      }}</span>
                    </p>
                    <p class="mt-2 text-sm text-brand-soft leading-relaxed">{{ paso.descripcion }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Quién actúa: {{ paso.actor }}
                    </p>
                    @if (paso.soloComercial) {
                      <p class="mt-1 text-xs text-amber-700">Visible para asesor / admin (no en bandeja del técnico).</p>
                    }
                  </li>
                }
              </ol>
            </div>
          </div>
        }

        @if (loading()) {
          <app-skeleton variant="bandeja-table" [rows]="6" />
        } @else if (error()) {
          <p class="mt-12 rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
        } @else if ((meta()?.total ?? 0) === 0) {
          <div class="mt-12 text-slate-500">
            @if (!hasActiveFilters()) {
              <p>Aún no hay casos en la bandeja.</p>
              @if (showDemoReseedCta()) {
                <p class="mt-3 text-sm">
                  ¿Empresa DEMO vacía?
                  <a routerLink="/perfil" class="font-semibold text-accent underline">Reiniciar datos DEMO</a>
                  desde Perfil (Owner).
                </p>
              }
            } @else {
              <p>
                No hay casos con estos filtros.
                <button type="button" class="ml-1 font-semibold text-accent underline" (click)="limpiarFiltros()">
                  Limpiar filtros
                </button>
              </p>
            }
          </div>
        } @else {
          <div class="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
            <table class="w-full min-w-[800px] text-left text-sm">
              <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'titulo'" (click)="toggleSort('titulo')">
                      Título
                      @if (sortCol() === 'titulo' && sortDir() === 'asc') {
                        <svg lucideArrowUp [size]="13"></svg>
                      } @else if (sortCol() === 'titulo' && sortDir() === 'desc') {
                        <svg lucideArrowDown [size]="13"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-3 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'aseguradora'" (click)="toggleSort('aseguradora')">
                      Cliente
                      @if (sortCol() === 'aseguradora' && sortDir() === 'asc') {
                        <svg lucideArrowUp [size]="13"></svg>
                      } @else if (sortCol() === 'aseguradora' && sortDir() === 'desc') {
                        <svg lucideArrowDown [size]="13"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-3 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'estado'" (click)="toggleSort('estado')">
                      Estado
                      @if (sortCol() === 'estado' && sortDir() === 'asc') {
                        <svg lucideArrowUp [size]="13"></svg>
                      } @else if (sortCol() === 'estado' && sortDir() === 'desc') {
                        <svg lucideArrowDown [size]="13"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  @if (!isTecnico()) {
                    <th class="px-4 py-3 font-semibold">
                      <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'tecnico'" (click)="toggleSort('tecnico')">
                        Técnico
                        @if (sortCol() === 'tecnico' && sortDir() === 'asc') {
                          <svg lucideArrowUp [size]="13"></svg>
                        } @else if (sortCol() === 'tecnico' && sortDir() === 'desc') {
                          <svg lucideArrowDown [size]="13"></svg>
                        } @else {
                          <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                        }
                      </button>
                    </th>
                  }
                  <th class="px-4 py-3 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'createdAt'" (click)="toggleSort('createdAt')">
                      Creado
                      @if (sortCol() === 'createdAt' && sortDir() === 'asc') {
                        <svg lucideArrowUp [size]="13"></svg>
                      } @else if (sortCol() === 'createdAt' && sortDir() === 'desc') {
                        <svg lucideArrowDown [size]="13"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-3 font-semibold">
                    <button type="button" class="th-sort" [class.th-sort-active]="sortCol() === 'updatedAt'" (click)="toggleSort('updatedAt')">
                      Actualizado
                      @if (sortCol() === 'updatedAt' && sortDir() === 'asc') {
                        <svg lucideArrowUp [size]="13"></svg>
                      } @else if (sortCol() === 'updatedAt' && sortDir() === 'desc') {
                        <svg lucideArrowDown [size]="13"></svg>
                      } @else {
                        <svg lucideArrowUpDown [size]="13" class="opacity-50"></svg>
                      }
                    </button>
                  </th>
                  <th class="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                @for (caso of casos(); track caso.id) {
                  <tr class="border-b border-slate-100 transition hover:bg-surface/80">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-brand-ink">
                        {{ caso.titulo }}
                        @if (caso.esGarantia) {
                          <span class="ml-1 badge bg-amber-100 text-amber-900">Garantía</span>
                        }
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500">
                        {{ caso.numeroAseguradora }} · {{ caso.titularNombre }} · {{ caso.ciudad }} ·
                        {{ caso.categoriaServicio }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-brand-soft">{{ caso.aseguradora }}</td>
                    <td class="px-4 py-3">
                      <span class="badge" [ngClass]="estadoClass(caso.estado)">{{
                        labelEstado(caso.estado)
                      }}</span>
                      <p class="mt-1 text-xs tabular-nums text-slate-500">
                        {{ pasoCorto(caso) }}
                      </p>
                    </td>
                    @if (!isTecnico()) {
                      <td class="px-4 py-3 text-brand-soft">{{ nombreTecnico(caso.tecnicoId) }}</td>
                    }
                    <td class="px-4 py-3">
                      <div class="leading-tight">
                        <p class="text-sm font-semibold text-brand-ink tabular-nums">
                          {{ caso.createdAt | date: 'dd/MM/yyyy' }}
                        </p>
                        <p class="text-xs font-medium text-brand-soft tabular-nums">
                          {{ caso.createdAt | date: 'HH:mm' }}
                        </p>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="leading-tight">
                        <p class="text-sm font-semibold text-brand-ink tabular-nums">
                          {{ caso.updatedAt | date: 'dd/MM/yyyy' }}
                        </p>
                        <p class="text-xs font-medium text-brand-soft tabular-nums">
                          {{ caso.updatedAt | date: 'HH:mm' }}
                        </p>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <a
                        [routerLink]="['/casos', caso.id]"
                        [queryParams]="casoLinkParams()"
                        class="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        {{ isTecnico() ? 'Ver / gestionar' : 'Abrir' }}
                        <svg lucideChevronRight [size]="14"></svg>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (meta(); as m) {
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-slate-500">{{ rangoLabel() }} de {{ m.total }}</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-ghost border border-slate-200 !px-3 !py-1.5"
                  [disabled]="m.page <= 1 || loading()"
                  (click)="goPage(m.page - 1)"
                >
                  <svg lucideChevronLeft [size]="16"></svg>
                  Anterior
                </button>
                <span class="text-sm font-medium text-brand-ink tabular-nums">
                  {{ m.page }} / {{ m.totalPages }}
                </span>
                <button
                  type="button"
                  class="btn-ghost border border-slate-200 !px-3 !py-1.5"
                  [disabled]="m.page >= m.totalPages || loading()"
                  (click)="goPage(m.page + 1)"
                >
                  Siguiente
                  <svg lucideChevronRight [size]="16"></svg>
                </button>
              </div>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [
    `
      .th-sort {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font: inherit;
        font-weight: 600;
        text-transform: inherit;
        letter-spacing: inherit;
        color: inherit;
        cursor: pointer;
        border: 0;
        background: transparent;
        padding: 0;
        border-radius: 0.25rem;
      }
      .th-sort:hover {
        color: var(--brand-ink);
      }
      .th-sort-active {
        color: var(--accent);
      }
      .btn-back {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.4rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--brand-soft);
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }
      .btn-back:hover {
        background: var(--surface-muted);
        border-color: var(--action);
        color: var(--action);
      }
    `,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly casosService = inject(CasosService);
  private readonly catalogos = inject(CatalogosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Origen (ej. Balance) para no perder el hilo al navegar. */
  readonly returnTo = signal<{
    path: string;
    queryParams: Record<string, string>;
    label: string;
  } | null>(null);
  readonly handoffNotice = signal(false);

  /** Estados visibles en el filtro según rol (técnico no ve ciclo comercial). */
  readonly estadosFiltro = computed(() => {
    const legacyGarantia = new Set(['EnGarantia', 'CerradoGarantia']);
    if (this.auth.hasRole('TECNICO')) {
      return ESTADOS_CASO.filter(
        (e) => !ESTADOS_OCULTOS_TECNICO.includes(e) && !legacyGarantia.has(e),
      );
    }
    // EnGarantia / CerradoGarantia se aliasan a Pagada en UI; filtra por Cobrado.
    return ESTADOS_CASO.filter((e) => !legacyGarantia.has(e));
  });
  readonly user = signal(this.auth.currentUser);
  readonly casos = signal<Caso[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly tecnicos = signal<TecnicoOption[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly ciudades = signal<string[]>([]);
  readonly aseguradoras = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('');
  readonly filtroComercial = signal(false);
  /** Solo confirmación + recepción de pago (nos deben). */
  readonly filtroNosDeben = signal(false);
  readonly filtroCategoria = signal('');
  readonly filtroCiudad = signal('');
  readonly filtroAseguradora = signal('');
  readonly mostrarGuiaEstados = signal(false);
  /** Orden de tabla (filtros aparte). Por defecto: más reciente primero. */
  readonly sortCol = signal<SortCol>('updatedAt');
  readonly sortDir = signal<SortDir>('desc');

  readonly rangoLabel = computed(() => {
    const m = this.meta();
    if (!m || m.total === 0) return '0–0';
    const from = (m.page - 1) * m.pageSize + 1;
    const to = Math.min(m.page * m.pageSize, m.total);
    return `${from}–${to}`;
  });

  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;
  private listSub?: Subscription;
  private firstLoad = true;

  /** Guía estática del flujo operativo (informativa, no datos del caso). */
  readonly guiaEstados: {
    estado: EstadoCaso;
    titulo: string;
    descripcion: string;
    actor: string;
    soloComercial?: boolean;
  }[] = [
    {
      estado: 'PendienteAsignacion',
      titulo: '1. Por asignar',
      descripcion:
        'El asesor registra la llamada: datos de cliente, titular, dirección y categoría. Aún no hay técnico.',
      actor: 'Asesor / Admin',
    },
    {
      estado: 'Asignado',
      titulo: '2. Técnico asignado',
      descripcion:
        'Se elige un técnico de la empresa. El caso queda listo para que inicie la visita en campo.',
      actor: 'Asesor / Admin',
    },
    {
      estado: 'EnGestion',
      titulo: '3. En visita',
      descripcion:
        'El técnico está en campo. Debe subir fotos de evidencia y obtener la firma del atendido antes de cerrar.',
      actor: 'Técnico',
    },
    {
      estado: 'PendienteDocumentoCobro',
      titulo: '4. Por facturar',
      descripcion:
        'La visita quedó completa (fotos + firma). El asesor arma las líneas y genera la factura / documento de cobro.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'PendienteConfirmacionAsegurado',
      titulo: '5. Factura enviada · espera OK',
      descripcion:
        'La factura ya se envió. Falta que el cliente la apruebe o la devuelva (OK) para poder registrar el pago.',
      actor: 'Administrador',
      soloComercial: true,
    },
    {
      estado: 'PendienteRecepcionPago',
      titulo: '6. Factura sin pagar',
      descripcion:
        'El cliente ya dio OK. La factura está aprobada y falta registrar el pago del cliente.',
      actor: 'Administrador',
      soloComercial: true,
    },
    {
      estado: 'Cobrado',
      titulo: '7. Pagada',
      descripcion:
        'Se registró el pago del cliente. La factura quedó pagada y el ciclo comercial cierra. El pago al técnico es un costo aparte (solo el administrador lo liquida).',
      actor: 'Administrador',
      soloComercial: true,
    },
    {
      estado: 'Asignado',
      titulo: '8. Garantía (reabre visita)',
      descripcion:
        'El administrador abre garantía: el caso vuelve a Asignado (o Por asignar). El técnico entra a visita sin cobro nuevo; el cobro ya pagado se conserva.',
      actor: 'Administrador',
      soloComercial: true,
    },
    {
      estado: 'Cobrado',
      titulo: '9. Cierra garantía → Pagada',
      descripcion:
        'Al cerrar la visita de garantía el caso vuelve a Pagada (paso 7/7). Balance sigue contando el cobro del cliente.',
      actor: 'Técnico',
      soloComercial: true,
    },
  ];

  readonly roleHint = computed(() => {
    const role = this.user()?.role;
    const empresa = this.user()?.empresaNombre ?? 'tu empresa';
    switch (role) {
      case 'ADMIN':
        return `Vista de ${empresa}: asigna técnicos, liquidación, OK/pagada y garantías (Administrador).`;
      case 'ASESOR':
        return `Crea casos desde la llamada y da seguimiento en ${empresa}.`;
      case 'TECNICO':
        return `Casos asignados en ${empresa}: gestiona, evidencia y firma.`;
      default:
        return '';
    }
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('handoff') === '1') {
      this.handoffNotice.set(true);
    }
    const back = safeReturnTo(qp.get('returnTo'));
    if (back) {
      const [path, qs] = back.split('?');
      const queryParams: Record<string, string> = {};
      if (qs) {
        new URLSearchParams(qs).forEach((v, k) => {
          queryParams[k] = v;
        });
      }
      this.returnTo.set({
        path: path || '/home',
        queryParams,
        label: returnLabel(back),
      });
    }

    const estado = qp.get('estado');
    if (estado && ESTADOS_CASO.includes(estado as EstadoCaso)) {
      this.filtroEstado.set(estado);
    }
    if (qp.get('vista') === 'comercial') {
      this.filtroComercial.set(true);
    }
    if (qp.get('vista') === 'nos-deben') {
      this.filtroNosDeben.set(true);
    }

    this.searchSub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        this.busqueda.set(q);
        this.page.set(1);
        this.loadCasos();
      });

    this.catalogos.getAll().subscribe({
      next: (cats) => {
        this.categorias.set(cats.categoriasServicio);
        this.ciudades.set(cats.ciudades.map((c) => c.nombre));
        this.aseguradoras.set(cats.aseguradoras.map((a) => a.nombre));
      },
      error: () => {
        /* filtros de catálogo opcionales */
      },
    });

    if (!this.auth.hasRole('TECNICO')) {
      this.casosService.getTecnicos().subscribe({
        next: (t) => this.tecnicos.set(t),
        error: () => this.tecnicos.set([]),
      });
    }

    this.loadCasos();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.listSub?.unsubscribe();
  }

  private loadCasos(): void {
    this.listSub?.unsubscribe();
    if (this.firstLoad) this.loading.set(true);
    this.error.set(null);

    let vista: 'comercial' | 'nos-deben' | '' = '';
    if (this.filtroNosDeben()) vista = 'nos-deben';
    else if (this.filtroComercial()) vista = 'comercial';

    this.listSub = this.casosService
      .list({
        page: this.page(),
        pageSize: PAGE_SIZE_DEFAULT,
        q: this.busqueda().trim() || undefined,
        estado: this.filtroEstado() || undefined,
        categoria: this.filtroCategoria() || undefined,
        ciudad: this.filtroCiudad() || undefined,
        aseguradora: this.filtroAseguradora() || undefined,
        vista,
        sort: this.sortCol(),
        sortDir: this.sortDir(),
      })
      .subscribe({
        next: (res) => {
          this.casos.set(res.data);
          this.meta.set(res.meta);
          this.page.set(res.meta.page);
          this.loading.set(false);
          this.firstLoad = false;
        },
        error: (err) => {
          this.loading.set(false);
          this.firstLoad = false;
          this.error.set(err?.error?.message ?? 'Error al cargar casos');
        },
      });
  }

  private resetPageAndLoad(): void {
    this.page.set(1);
    this.loadCasos();
  }

  onBusqueda(value: string): void {
    this.search$.next(value);
  }

  onFiltroCategoria(value: string): void {
    this.filtroCategoria.set(value);
    this.resetPageAndLoad();
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.filtroComercial.set(false);
    this.filtroNosDeben.set(false);
    this.resetPageAndLoad();
  }

  onFiltroCiudad(value: string): void {
    this.filtroCiudad.set(value);
    this.resetPageAndLoad();
  }

  onFiltroAseguradora(value: string): void {
    this.filtroAseguradora.set(value);
    this.resetPageAndLoad();
  }

  goPage(p: number): void {
    const m = this.meta();
    if (!m || p < 1 || p > m.totalPages) return;
    this.page.set(p);
    this.loadCasos();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.busqueda().trim() ||
      this.filtroEstado() ||
      this.filtroCategoria() ||
      this.filtroCiudad() ||
      this.filtroAseguradora() ||
      this.filtroComercial() ||
      this.filtroNosDeben()
    );
  }

  /** CTA a Perfil → Reiniciar datos DEMO (Owner de empresa DEMO). */
  showDemoReseedCta(): boolean {
    const u = this.auth.currentUser;
    if (!u || u.role !== 'ADMIN' || !u.esOwner) return false;
    return (u.empresaNombre ?? '').toUpperCase() === 'DEMO';
  }

  /** Al abrir un caso, volver a esta bandeja (con filtros) y, si aplica, al origen. */
  casoLinkParams(): Record<string, string> {
    return { returnTo: this.router.url };
  }

  nombreTecnico(tecnicoId: string | null): string {
    if (!tecnicoId) return '—';
    return this.tecnicos().find((t) => t.id === tecnicoId)?.nombre ?? '—';
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('');
    this.filtroComercial.set(false);
    this.filtroNosDeben.set(false);
    this.filtroCategoria.set('');
    this.filtroCiudad.set('');
    this.filtroAseguradora.set('');
    this.sortCol.set('updatedAt');
    this.sortDir.set('desc');
    this.page.set(1);
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    void this.router.navigate(['/home'], {
      queryParams: returnTo ? { returnTo } : {},
      replaceUrl: true,
    });
    this.loadCasos();
  }

  toggleSort(col: SortCol): void {
    if (this.sortCol() === col) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortCol.set(col);
      this.sortDir.set(col === 'updatedAt' || col === 'createdAt' ? 'desc' : 'asc');
    }
    this.resetPageAndLoad();
  }

  canCreate(): boolean {
    return this.auth.hasRole('ASESOR', 'ADMIN');
  }

  isTecnico(): boolean {
    return this.auth.hasRole('TECNICO');
  }

  labelEstado(e: EstadoCaso): string {
    return labelEstadoCaso(e);
  }

  pasoCorto(c: { estado: EstadoCaso; esGarantia: boolean }): string {
    return flujoCasoCorto(c);
  }

  estadoClass(estado: EstadoCaso): string {
    switch (estado) {
      case 'PendienteAsignacion':
        return 'bg-sky-100 text-sky-900';
      case 'Asignado':
        return 'bg-amber-100 text-amber-900';
      case 'EnGestion':
        return 'bg-teal-100 text-teal-900';
      case 'PendienteDocumentoCobro':
        return 'bg-orange-100 text-orange-900';
      case 'PendienteConfirmacionAsegurado':
        return 'bg-blue-100 text-blue-900';
      case 'PendienteRecepcionPago':
        return 'bg-teal-100 text-teal-800';
      case 'Cobrado':
        return 'bg-emerald-100 text-emerald-900';
      case 'EnGarantia':
        return 'bg-orange-100 text-orange-900';
      case 'CerradoGarantia':
        return 'bg-slate-200 text-slate-700';
    }
  }

  estadoDotClass(estado: EstadoCaso): string {
    switch (estado) {
      case 'PendienteAsignacion':
        return 'bg-sky-600';
      case 'Asignado':
        return 'bg-amber-600';
      case 'EnGestion':
        return 'bg-teal-700';
      case 'PendienteDocumentoCobro':
        return 'bg-orange-600';
      case 'PendienteConfirmacionAsegurado':
        return 'bg-blue-600';
      case 'PendienteRecepcionPago':
        return 'bg-teal-600';
      case 'Cobrado':
        return 'bg-emerald-600';
      case 'EnGarantia':
        return 'bg-orange-600';
      case 'CerradoGarantia':
        return 'bg-slate-600';
    }
  }
}
