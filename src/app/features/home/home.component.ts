import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CasosService } from '../../core/services/casos.service';
import type { Caso, EstadoCaso } from '../../core/models/caso.model';
import { ESTADOS_CASO, ESTADOS_OCULTOS_TECNICO } from '../../core/models/caso.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, RouterLink],
  template: `
    <div>
      <main class="mx-auto max-w-6xl px-6 py-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-semibold text-brand-ink">Bandeja de entrada</h1>
            <p class="mt-1 text-brand-soft/80">{{ roleHint() }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm text-slate-500">{{ casosFiltrados().length }} de {{ casos().length }}</p>
            @if (canCreate()) {
              <a routerLink="/casos/nuevo" class="btn-estado">Crear nuevo caso</a>
            }
          </div>
        </div>

        <!-- Filtros avanzados (todos los roles) -->
        <div class="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="block sm:col-span-2 lg:col-span-2">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar
            </span>
            <input
              type="search"
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Nº aseguradora, titular o título…"
              [ngModel]="busqueda()"
              (ngModelChange)="busqueda.set($event)"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categoría
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroCategoria()"
              (ngModelChange)="filtroCategoria.set($event)"
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
                class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-[11px] font-bold text-accent transition hover:bg-accent hover:text-white"
                title="Ver guía de estados"
                aria-label="Información de estados del flujo"
                (click)="mostrarGuiaEstados.set(true)"
              >
                !
              </button>
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroEstado()"
              (ngModelChange)="filtroEstado.set($event)"
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
              (ngModelChange)="filtroCiudad.set($event)"
            >
              <option value="">Todas</option>
              @for (c of ciudades(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Aseguradora
            </span>
            <select
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              [ngModel]="filtroAseguradora()"
              (ngModelChange)="filtroAseguradora.set($event)"
            >
              <option value="">Todas</option>
              @for (a of aseguradoras(); track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </label>

          <div class="flex items-end sm:col-span-2 lg:col-span-2">
            <button type="button" class="btn-ghost border border-slate-200" (click)="limpiarFiltros()">
              Limpiar filtros
            </button>
          </div>
        </div>

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
                <button type="button" class="btn-ghost !px-2" (click)="mostrarGuiaEstados.set(false)">
                  Cerrar
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
          <p class="mt-12 text-slate-500">Cargando casos…</p>
        } @else if (error()) {
          <p class="mt-12 rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
        } @else if (casosFiltrados().length === 0) {
          <p class="mt-12 text-slate-500">No hay casos para mostrar con estos filtros.</p>
        } @else {
          <div class="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
            <table class="w-full min-w-[720px] text-left text-sm">
              <thead class="border-b border-slate-200 bg-surface-muted/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-semibold">Título</th>
                  <th class="px-4 py-3 font-semibold">Aseguradora</th>
                  <th class="px-4 py-3 font-semibold">Categoría</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold">Ciudad</th>
                  <th class="px-4 py-3 font-semibold">Actualizado</th>
                  <th class="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                @for (caso of casosFiltrados(); track caso.id) {
                  <tr class="border-b border-slate-100 transition hover:bg-surface/80">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-brand-ink">
                        {{ caso.titulo }}
                        @if (caso.esGarantia) {
                          <span class="ml-1 badge bg-amber-100 text-amber-900">Garantía</span>
                        }
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500">
                        {{ caso.numeroAseguradora }} · {{ caso.titularNombre }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-brand-soft">{{ caso.aseguradora }}</td>
                    <td class="px-4 py-3 text-brand-soft">{{ caso.categoriaServicio }}</td>
                    <td class="px-4 py-3">
                      <span class="badge" [ngClass]="estadoClass(caso.estado)">{{
                        labelEstado(caso.estado)
                      }}</span>
                    </td>
                    <td class="px-4 py-3 text-brand-soft">{{ caso.ciudad }}</td>
                    <td class="px-4 py-3 text-slate-500">
                      {{ caso.updatedAt | date: 'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-4 py-3">
                      <a
                        [routerLink]="['/casos', caso.id]"
                        class="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        {{ isTecnico() ? 'Ver / gestionar' : 'Abrir' }}
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </main>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly casosService = inject(CasosService);

  /** Estados visibles en el filtro según rol (técnico no ve ciclo comercial). */
  readonly estadosFiltro = computed(() => {
    if (this.auth.hasRole('TECNICO')) {
      return ESTADOS_CASO.filter((e) => !ESTADOS_OCULTOS_TECNICO.includes(e));
    }
    return [...ESTADOS_CASO];
  });
  readonly user = signal(this.auth.currentUser);
  readonly casos = signal<Caso[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('');
  readonly filtroCategoria = signal('');
  readonly filtroCiudad = signal('');
  readonly filtroAseguradora = signal('');
  readonly mostrarGuiaEstados = signal(false);

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
      titulo: '1. Caso creado',
      descripcion:
        'El asesor registra la llamada: datos de aseguradora, titular, dirección y categoría. Aún no hay técnico.',
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
      titulo: '3. En gestión',
      descripcion:
        'El técnico inició el servicio. Debe subir fotos de evidencia y obtener la firma del atendido antes de cerrar.',
      actor: 'Técnico',
    },
    {
      estado: 'PendienteDocumentoCobro',
      titulo: '4. Documento de cobro',
      descripcion:
        'La gestión quedó completa (fotos + firma). El asesor arma las líneas de cobro y genera el documento.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'PendienteConfirmacionAsegurado',
      titulo: '5. Confirmación del asegurado',
      descripcion:
        'El documento de cobro fue generado. Se espera la confirmación del asegurado antes de recibir el pago.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'PendienteRecepcionPago',
      titulo: '6. Recepción de pago',
      descripcion:
        'El asegurado confirmó. El caso espera el registro de la recepción del pago.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'Cobrado',
      titulo: '7. Cobrado',
      descripcion:
        'Se registró el pago. El ciclo comercial del servicio queda cerrado.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'EnGarantia',
      titulo: '8. En garantía',
      descripcion:
        'El asesor/admin abre garantía y asigna (o reasigna) técnico. El técnico no ve este estado: le llega como Asignado con bandera de garantía.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
    {
      estado: 'CerradoGarantia',
      titulo: '9. Garantía cerrada',
      descripcion:
        'Tras evidencia y firma en modo garantía (sin cobro). Queda en historial para asesor/admin; el técnico no lo ve en bandeja.',
      actor: 'Asesor / Admin',
      soloComercial: true,
    },
  ];

  readonly ciudades = computed(() =>
    [...new Set(this.casos().map((c) => c.ciudad).filter(Boolean))].sort(),
  );

  readonly aseguradoras = computed(() =>
    [...new Set(this.casos().map((c) => c.aseguradora).filter(Boolean))].sort(),
  );

  readonly casosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const categoria = this.filtroCategoria();
    const ciudad = this.filtroCiudad();
    const aseguradora = this.filtroAseguradora();

    return this.casos().filter((c) => {
      if (estado && c.estado !== estado) return false;
      if (categoria && c.categoriaServicio !== categoria) return false;
      if (ciudad && c.ciudad !== ciudad) return false;
      if (aseguradora && c.aseguradora !== aseguradora) return false;

      if (!q) return true;

      const haystack = [
        c.titulo,
        c.numeroAseguradora,
        c.titularNombre,
        c.aseguradora,
        c.descripcion,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  });

  readonly roleHint = computed(() => {
    const role = this.user()?.role;
    const empresa = this.user()?.empresaNombre ?? 'tu empresa';
    switch (role) {
      case 'ADMIN':
        return `Vista de ${empresa}: asigna técnicos, cobranza stub y garantías.`;
      case 'ASESOR':
        return `Crea casos desde la llamada y da seguimiento en ${empresa}.`;
      case 'TECNICO':
        return `Casos asignados en ${empresa}: gestiona, evidencia y firma.`;
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.casosService.list().subscribe({
      next: (data) => {
        this.casos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al cargar casos');
      },
    });

    this.casosService.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats),
      error: () => {
        const fromData = [...new Set(this.casos().map((c) => c.categoriaServicio))];
        this.categorias.set(fromData);
      },
    });
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('');
    this.filtroCategoria.set('');
    this.filtroCiudad.set('');
    this.filtroAseguradora.set('');
  }

  canCreate(): boolean {
    return this.auth.hasRole('ASESOR', 'ADMIN');
  }

  isTecnico(): boolean {
    return this.auth.hasRole('TECNICO');
  }

  labelEstado(e: EstadoCaso): string {
    const map: Record<EstadoCaso, string> = {
      PendienteAsignacion: 'Pendiente asignación',
      Asignado: 'Asignado',
      EnGestion: 'En gestión',
      PendienteDocumentoCobro: 'Pendiente documento cobro',
      PendienteConfirmacionAsegurado: 'Pendiente confirmación asegurado',
      PendienteRecepcionPago: 'Pendiente recepción pago',
      Cobrado: 'Cobrado',
      EnGarantia: 'En garantía',
      CerradoGarantia: 'Cerrado (garantía)',
    };
    return map[e] ?? e;
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
