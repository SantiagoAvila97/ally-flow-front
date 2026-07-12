import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CasosService } from '../../core/services/casos.service';
import { CostosService } from '../../core/services/costos.service';
import type { Caso, EstadoCaso, LineaCobro, TecnicoOption, TipoFirmaCierre } from '../../core/models/caso.model';
import type { CategoriaConItems, ItemCosto } from '../../core/models/costo.model';
import { mapsLinks } from '../../shared/maps.util';
import { SignaturePadComponent } from '../../shared/signature-pad.component';

type ConfirmKind =
  | 'asignar'
  | 'iniciar'
  | 'cerrar'
  | 'enviar'
  | 'confirmar'
  | 'cobrar'
  | 'garantia';

interface ConfirmEstadoPayload {
  kind: ConfirmKind;
  fromLabel: string;
  toLabel: string;
  lines: string[];
}

@Component({
  selector: 'app-caso-detalle',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule, RouterLink, SignaturePadComponent],
  template: `
    <div class="pb-16">
      <main class="mx-auto max-w-4xl px-6 py-8">
        <div class="mb-6">
          <a routerLink="/home" class="btn-ghost">← Bandeja</a>
        </div>

        @if (loading()) {
          <p class="text-slate-500">Cargando…</p>
        } @else if (error() && !caso()) {
          <p class="rounded-md bg-red-50 px-4 py-3 text-red-700">{{ error() }}</p>
        } @else {
          @if (caso(); as c) {
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-3xl font-semibold text-brand-ink">{{ c.titulo }}</h1>
                @if (c.esGarantia) {
                  <span class="badge bg-amber-100 text-amber-900">Garantía</span>
                }
              </div>
              <p class="mt-2">
                <span class="badge" [ngClass]="estadoClass(c.estado)">{{ labelEstado(c.estado) }}</span>
              </p>
            </div>
          </div>

          @if (actionError()) {
            <p class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ actionError() }}</p>
          }

          <dl class="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Nº aseguradora</dt>
              <dd class="mt-1 font-medium">{{ c.numeroAseguradora }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Aseguradora</dt>
              <dd class="mt-1 font-medium">{{ c.aseguradora }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Titular</dt>
              <dd class="mt-1 font-medium">{{ c.titularNombre }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Teléfono</dt>
              <dd class="mt-1 font-medium">
                <a class="text-accent underline" [href]="'tel:' + c.titularTelefono">{{ c.titularTelefono }}</a>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Dirección del servicio</dt>
              <dd class="mt-1 font-medium">
                {{ c.direccion }}, {{ c.ciudad }}
              </dd>
              @if (c.direccionNormalizada) {
                <p class="mt-1 text-xs text-slate-500">{{ c.direccionNormalizada }}</p>
              }
              <div class="mt-2 flex flex-wrap gap-2">
                <a class="btn-primary !text-xs" [href]="links.google" target="_blank" rel="noopener">Google Maps</a>
                <a class="btn-ghost !text-xs border border-slate-200" [href]="links.apple" target="_blank" rel="noopener">Apple Maps</a>
                <a class="btn-ghost !text-xs border border-slate-200" [href]="links.waze" target="_blank" rel="noopener">Waze</a>
              </div>
              @if (mapEmbedSafe()) {
                <iframe
                  class="mt-3 h-48 w-full rounded-lg border border-slate-200"
                  [src]="mapEmbedSafe()!"
                  title="Mapa del servicio"
                  loading="lazy"
                ></iframe>
              }
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Categoría</dt>
              <dd class="mt-1 font-medium">{{ c.categoriaServicio }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-slate-500">Observaciones</dt>
              <dd class="mt-1 font-medium whitespace-pre-wrap">{{ c.observaciones || '—' }}</dd>
            </div>
          </dl>

          <!-- Acciones ASESOR / ADMIN -->
          @if (canAsignar(c)) {
            <section class="mt-8 rounded-lg border border-slate-200 bg-white p-5">
              <h2 class="text-sm font-semibold text-brand-ink">Asignar técnico</h2>
              <div class="mt-3 flex flex-wrap gap-2">
                <select class="rounded-md border border-slate-300 px-3 py-2 text-sm" [(ngModel)]="tecnicoSelected">
                  <option value="">Selecciona técnico…</option>
                  @for (t of tecnicos(); track t.id) {
                    <option [value]="t.id">{{ t.nombre }}</option>
                  }
                </select>
                <button type="button" class="btn-estado" [disabled]="!tecnicoSelected || busy()" (click)="pedirAsignar(c)">
                  Asignar
                </button>
              </div>
            </section>
          }

          @if (canArmarDocumento(c)) {
            <section class="mt-8 rounded-lg border border-orange-200 bg-orange-50/40 p-5">
              <h2 class="text-sm font-semibold text-brand-ink">Documento de cobro</h2>
              @if (c.documentoCobroGeneradoAt) {
                <p class="mt-1 text-xs text-slate-500">
                  PDF generado: {{ c.documentoCobroGeneradoAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              }

              @if (draftLineas.length) {
                <div class="mt-4 overflow-x-auto">
                  <table class="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th class="py-2 pr-2 font-medium">Ítem</th>
                        <th class="py-2 pr-2 font-medium">Unidad</th>
                        <th class="py-2 pr-2 font-medium">Cant.</th>
                        <th class="py-2 pr-2 font-medium text-right">P. unit.</th>
                        <th class="py-2 pr-2 font-medium text-right">Subtotal</th>
                        <th class="py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (linea of draftLineas; track $index; let i = $index) {
                        <tr class="border-b border-slate-100">
                          <td class="py-2 pr-2 font-medium">{{ linea.nombre }}</td>
                          <td class="py-2 pr-2 text-slate-600">{{ linea.unidad }}</td>
                          <td class="py-2 pr-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              class="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                              [(ngModel)]="linea.cantidad"
                            />
                          </td>
                          <td class="py-2 pr-2 text-right tabular-nums">
                            {{ linea.precioUnitario | number: '1.0-2' }}
                          </td>
                          <td class="py-2 pr-2 text-right tabular-nums font-medium">
                            {{ linea.cantidad * linea.precioUnitario | number: '1.0-2' }}
                          </td>
                          <td class="py-2 text-right">
                            <button
                              type="button"
                              class="btn-ghost !text-xs text-red-700"
                              [disabled]="busy()"
                              (click)="quitarLinea(i)"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="4" class="pt-3 text-right text-xs uppercase tracking-wide text-slate-500">
                          Total
                        </td>
                        <td class="pt-3 text-right font-semibold tabular-nums">
                          {{ totalDraft() | number: '1.0-2' }}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              } @else {
                <p class="mt-3 text-sm text-slate-500">Aún no hay líneas. Agrega ítems del catálogo.</p>
              }

              <div class="mt-4 flex flex-wrap items-end gap-2">
                <div class="min-w-[240px] flex-1">
                  <label class="text-xs uppercase tracking-wide text-slate-500">Agregar ítem</label>
                  <select
                    class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    [(ngModel)]="itemToAddId"
                  >
                    <option value="">Selecciona del catálogo…</option>
                    @for (opt of catalogoOpciones(); track opt.id) {
                      <option [value]="opt.id">{{ opt.label }}</option>
                    }
                  </select>
                  @if (catalogoError()) {
                    <p class="mt-1 text-xs text-red-600">{{ catalogoError() }}</p>
                  } @else if (!catalogoOpciones().length && !catalogoLoading()) {
                    <p class="mt-1 text-xs text-amber-700">
                      No hay ítems activos. Créalos en Costos (admin).
                    </p>
                  }
                </div>
                <button
                  type="button"
                  class="btn-primary"
                  [disabled]="!itemToAddId || busy() || catalogoLoading()"
                  (click)="agregarLinea()"
                >
                  Agregar
                </button>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-primary"
                  [disabled]="busy() || !draftLineas.length"
                  (click)="guardarLineas(c)"
                >
                  Guardar líneas
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  [disabled]="busy() || !c.lineasCobro.length"
                  (click)="descargarPdf(c)"
                >
                  Descargar PDF
                </button>
                <button
                  type="button"
                  class="btn-estado"
                  [disabled]="busy() || !c.lineasCobro.length"
                  (click)="pedirMarcarEnviado(c)"
                >
                  Marcar enviado
                </button>
              </div>
            </section>
          }

          @if (canConfirmarAsegurado(c)) {
            <section class="mt-8 rounded-lg border border-blue-200 bg-blue-50/40 p-5">
              <h2 class="text-sm font-semibold text-brand-ink">Confirmación del asegurado</h2>
              <p class="mt-1 text-sm text-slate-600">
                El documento fue enviado. Confirma cuando el asegurado lo apruebe.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-estado"
                  [disabled]="busy()"
                  (click)="pedirConfirmarAsegurado(c)"
                >
                  Confirmar asegurado
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  [disabled]="busy() || !c.lineasCobro.length"
                  (click)="descargarPdf(c)"
                >
                  Descargar PDF
                </button>
              </div>
            </section>
          }

          @if (canMarcarCobrado(c)) {
            <section class="mt-8 rounded-lg border border-teal-200 bg-teal-50/40 p-5">
              <h2 class="text-sm font-semibold text-brand-ink">Recepción de pago</h2>
              <p class="mt-1 text-sm text-slate-600">Marca el caso como cobrado cuando el pago sea recibido.</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" class="btn-estado" [disabled]="busy()" (click)="pedirCobrar(c)">
                  Marcar cobrado
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  [disabled]="busy() || !c.lineasCobro.length"
                  (click)="descargarPdf(c)"
                >
                  Descargar PDF
                </button>
              </div>
            </section>
          }

          @if (canGarantia(c)) {
            <section class="mt-6">
              <button type="button" class="btn-estado" [disabled]="busy()" (click)="pedirGarantia(c)">
                Abrir por garantía
              </button>
            </section>
          }

          <!-- Acciones TECNICO -->
          @if (isTecnicoAsignado(c)) {
            <section class="mt-8 space-y-6 rounded-lg border border-accent/30 bg-accent-soft/20 p-5 ring-1 ring-accent/20">
              <h2 class="text-sm font-semibold text-accent">Acciones de técnico</h2>

              @if (c.estado === 'Asignado') {
                <button type="button" class="btn-estado" [disabled]="busy()" (click)="pedirIniciar(c)">
                  Iniciar gestión
                </button>
              }

              @if (c.estado === 'EnGestion') {
                <div>
                  <h3 class="text-sm font-semibold">Evidencias ({{ c.fotos.length }})</h3>
                  @if (c.fotos.length) {
                    <ul class="mt-2 flex flex-wrap gap-2">
                      @for (f of c.fotos; track f) {
                        <li>
                          <a [href]="f" target="_blank" rel="noopener">
                            <img [src]="f" alt="Evidencia" class="h-20 w-28 rounded border object-cover" />
                          </a>
                        </li>
                      }
                    </ul>
                  }
                  <div class="mt-3 flex flex-wrap gap-2">
                    <input
                      type="url"
                      class="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                      [(ngModel)]="fotoUrl"
                      placeholder="URL de foto evidencia"
                    />
                    <button type="button" class="btn-primary" [disabled]="busy()" (click)="subirFoto(c)">
                      Subir foto
                    </button>
                  </div>
                </div>

                @if (!modoCerrar()) {
                  <div class="rounded-md border border-slate-200 bg-white p-4">
                    <h3 class="text-sm font-semibold text-brand-ink">Documentar visita</h3>
                    <p class="mt-1 text-xs text-slate-500">
                      El caso sigue en gestión. Úsalo si aún no se cierra en esta visita.
                    </p>
                    <textarea
                      class="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      rows="3"
                      [(ngModel)]="notaDocumentacion"
                      placeholder="Qué se hizo hoy, pendientes, material, etc."
                    ></textarea>
                    <button
                      type="button"
                      class="btn-ghost mt-3 border border-slate-200"
                      [disabled]="busy() || notaDocumentacion.trim().length < 3"
                      (click)="documentar(c)"
                    >
                      Guardar documentación
                    </button>
                    <button
                      type="button"
                      class="mt-4 block w-full text-left text-sm font-semibold text-accent underline"
                      (click)="modoCerrar.set(true)"
                    >
                      Cerrar caso
                    </button>
                  </div>
                } @else {
                  <div class="rounded-md border border-accent/40 bg-white p-4">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h3 class="text-sm font-semibold text-brand-ink">Cerrar caso</h3>
                        <p class="mt-1 text-xs text-slate-500">
                          Requiere ≥1 foto y firma (técnico y/o atendido).
                        </p>
                      </div>
                      <button
                        type="button"
                        class="btn-ghost !text-xs border border-slate-200"
                        (click)="cancelarCierre()"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div class="mt-3 space-y-2 text-sm">
                      <label class="flex items-center gap-2">
                        <input type="radio" name="tipoFirma" value="TECNICO" [(ngModel)]="tipoFirma" />
                        Firma del técnico
                      </label>
                      <label class="flex items-center gap-2">
                        <input type="radio" name="tipoFirma" value="ATENDIDO" [(ngModel)]="tipoFirma" />
                        Firma del atendido / usuario
                      </label>
                      <label class="flex items-center gap-2">
                        <input type="radio" name="tipoFirma" value="AMBAS" [(ngModel)]="tipoFirma" />
                        Ambas firmas
                      </label>
                    </div>

                    @if (tipoFirma === 'TECNICO' || tipoFirma === 'AMBAS') {
                      <div class="mt-3">
                        <p class="text-xs font-semibold uppercase text-slate-500">Firma técnico</p>
                        @if (firmaTecnico()) {
                          <img [src]="firmaTecnico()!" alt="Firma técnico" class="mt-1 h-20 rounded border bg-white" />
                          <button type="button" class="btn-ghost !text-xs" (click)="firmaTecnico.set(null)">Limpiar</button>
                        } @else {
                          <app-signature-pad (signed)="firmaTecnico.set($event)" />
                        }
                      </div>
                    }

                    @if (tipoFirma === 'ATENDIDO' || tipoFirma === 'AMBAS') {
                      <div class="mt-3">
                        <p class="text-xs font-semibold uppercase text-slate-500">Firma atendido</p>
                        @if (firmaAtendido()) {
                          <img [src]="firmaAtendido()!" alt="Firma atendido" class="mt-1 h-20 rounded border bg-white" />
                          <button type="button" class="btn-ghost !text-xs" (click)="firmaAtendido.set(null)">Limpiar</button>
                        } @else {
                          <app-signature-pad (signed)="firmaAtendido.set($event)" />
                        }
                      </div>
                    }

                    <button
                      type="button"
                      class="btn-estado mt-4 w-full"
                      [disabled]="busy() || c.fotos.length < 1 || !puedeCerrar()"
                      (click)="pedirCerrarCaso(c)"
                    >
                      Confirmar cierre
                    </button>
                  </div>
                }
              }
            </section>
          }

          <!-- Fotos / firma lectura -->
          @if (c.fotos.length || c.firmaAtendidoUrl || c.firmaTecnicoUrl) {
            <section class="mt-8">
              <h2 class="text-sm font-semibold text-brand-ink">Evidencia registrada</h2>
              @if (c.fotos.length) {
                <ul class="mt-3 flex flex-wrap gap-2">
                  @for (f of c.fotos; track f) {
                    <li>
                      <a [href]="f" target="_blank" rel="noopener">
                        <img [src]="f" alt="Foto" class="h-24 w-36 rounded border object-cover" />
                      </a>
                    </li>
                  }
                </ul>
              }
              @if (c.firmaTecnicoUrl) {
                <div class="mt-4">
                  <p class="text-xs uppercase tracking-wide text-slate-500">Firma del técnico</p>
                  <img [src]="c.firmaTecnicoUrl" alt="Firma técnico" class="mt-1 h-28 rounded border bg-white" />
                </div>
              }
              @if (c.firmaAtendidoUrl) {
                <div class="mt-4">
                  <p class="text-xs uppercase tracking-wide text-slate-500">Firma del atendido</p>
                  <img [src]="c.firmaAtendidoUrl" alt="Firma atendido" class="mt-1 h-28 rounded border bg-white" />
                </div>
              }
            </section>
          }

          <!-- Timeline -->
          <section class="mt-10">
            <h2 class="text-xl font-semibold text-brand-ink">Línea de tiempo</h2>
            <ol class="mt-4 space-y-0 border-l-2 border-slate-200 pl-6">
              @for (h of c.historialCambios; track h.fecha + h.estado + h.usuarioId; let i = $index) {
                <li class="relative pb-6">
                  <span
                    class="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-accent shadow"
                  ></span>
                  <p class="text-sm font-semibold text-brand-ink">{{ labelEstado(h.estado) }}</p>
                  <p class="text-xs text-slate-500">
                    {{ h.fecha | date: 'dd/MM/yyyy HH:mm' }} · {{ h.usuarioNombre }}
                  </p>
                  @if (h.nota) {
                    <p class="mt-1 text-sm text-brand-soft">{{ h.nota }}</p>
                  }
                </li>
              }
            </ol>
          </section>
          }
        }
      </main>

      @if (confirmOpen(); as conf) {
        <div class="modal-backdrop" (click)="cerrarConfirmacion()">
          <div class="modal-panel" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <h3 class="text-lg font-semibold text-brand-ink">¿Avanzar estado?</h3>
            <p class="mt-2 text-sm text-brand-soft">
              <span class="font-semibold text-brand-ink">{{ conf.fromLabel }}</span>
              <span class="mx-1.5 text-slate-400">→</span>
              <span class="font-semibold text-emerald-800">{{ conf.toLabel }}</span>
            </p>

            <ul class="mt-4 space-y-1.5 rounded-md border border-slate-200 bg-surface-muted/40 px-3 py-3 text-sm text-brand-ink">
              @for (line of conf.lines; track $index) {
                <li>{{ line }}</li>
              }
            </ul>

            <div class="mt-5 flex justify-end gap-2">
              <button type="button" class="btn-ghost border border-slate-200" [disabled]="busy()" (click)="cerrarConfirmacion()">
                Cancelar
              </button>
              <button type="button" class="btn-estado" [disabled]="busy()" (click)="ejecutarConfirmacion()">
                {{ busy() ? 'Procesando…' : 'Confirmar avance' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgb(7 20 34 / 0.45);
        padding: 1rem;
      }
      .modal-panel {
        width: 100%;
        max-width: 28rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 24px 60px -24px rgb(15 42 68 / 0.45);
      }
    `,
  ],
})
export class CasoDetalleComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly casosService = inject(CasosService);
  private readonly costosService = inject(CostosService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly caso = signal<Caso | null>(null);
  readonly tecnicos = signal<TecnicoOption[]>([]);
  readonly catalogo = signal<CategoriaConItems[]>([]);
  readonly catalogoLoading = signal(false);
  readonly catalogoError = signal<string | null>(null);
  readonly catalogoOpciones = computed(() => {
    const opts: { id: string; label: string }[] = [];
    for (const cat of this.catalogo()) {
      for (const item of cat.items) {
        if (!item.activo) continue;
        opts.push({
          id: item.id,
          label: `${cat.nombre} · ${item.nombre} — ${item.precioSugerido.toLocaleString('es-CO')} / ${item.unidad}`,
        });
      }
    }
    return opts;
  });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busy = signal(false);
  readonly firmaTecnico = signal<string | null>(null);
  readonly firmaAtendido = signal<string | null>(null);
  readonly mapEmbedSafe = signal<SafeResourceUrl | null>(null);
  readonly modoCerrar = signal(false);
  readonly confirmOpen = signal<ConfirmEstadoPayload | null>(null);

  draftLineas: LineaCobro[] = [];
  itemToAddId = '';
  tecnicoSelected = '';
  fotoUrl = 'https://placehold.co/600x400/0f766e/ffffff?text=Evidencia';
  notaDocumentacion = '';
  tipoFirma: TipoFirmaCierre = 'TECNICO';
  links = mapsLinks('', '');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
    this.casosService.getTecnicos().subscribe({
      next: (t) => this.tecnicos.set(t),
    });
    if (this.isAdmin() || this.isAsesor()) {
      this.loadCatalogo();
    }
  }

  private loadCatalogo(): void {
    this.catalogoLoading.set(true);
    this.catalogoError.set(null);
    this.costosService.listTree().subscribe({
      next: (tree) => {
        this.catalogo.set(tree);
        this.catalogoLoading.set(false);
      },
      error: (err) => {
        this.catalogoLoading.set(false);
        this.catalogoError.set(
          err?.error?.message ?? 'No se pudo cargar el catálogo de costos',
        );
      },
    });
  }

  isAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  isAsesor(): boolean {
    return this.auth.hasRole('ASESOR');
  }

  isTecnicoAsignado(c: Caso): boolean {
    return this.auth.hasRole('TECNICO') && c.tecnicoId === this.auth.currentUser?.id;
  }

  canAsignar(c: Caso): boolean {
    return (
      (this.isAdmin() || this.isAsesor()) &&
      (c.estado === 'PendienteAsignacion' || c.estado === 'EnGarantia')
    );
  }

  private canGestionarCobro(c: Caso): boolean {
    return (this.isAdmin() || this.isAsesor()) && !c.esGarantia;
  }

  canArmarDocumento(c: Caso): boolean {
    return this.canGestionarCobro(c) && c.estado === 'PendienteDocumentoCobro';
  }

  canConfirmarAsegurado(c: Caso): boolean {
    return this.canGestionarCobro(c) && c.estado === 'PendienteConfirmacionAsegurado';
  }

  canMarcarCobrado(c: Caso): boolean {
    return this.canGestionarCobro(c) && c.estado === 'PendienteRecepcionPago';
  }

  canGarantia(c: Caso): boolean {
    return (
      (this.isAdmin() || this.isAsesor()) &&
      (c.estado === 'Cobrado' || c.estado === 'CerradoGarantia')
    );
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

  totalDraft(): number {
    return this.draftLineas.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0);
  }

  agregarLinea(): void {
    const item = this.findItem(this.itemToAddId);
    if (!item) return;
    const existing = this.draftLineas.find((l) => l.itemCostoId === item.id);
    if (existing) {
      existing.cantidad = Number(existing.cantidad) + 1;
    } else {
      this.draftLineas = [
        ...this.draftLineas,
        {
          itemCostoId: item.id,
          nombre: item.nombre,
          unidad: item.unidad,
          cantidad: 1,
          precioUnitario: item.precioSugerido,
        },
      ];
    }
    this.itemToAddId = '';
  }

  quitarLinea(index: number): void {
    this.draftLineas = this.draftLineas.filter((_, i) => i !== index);
  }

  guardarLineas(c: Caso): void {
    const lineas = this.normalizeDraftLineas();
    if (!lineas.length) {
      this.actionError.set('Agrega al menos una línea de cobro');
      return;
    }
    this.run(() => this.casosService.setLineasCobro(c.id, lineas));
  }

  descargarPdf(c: Caso): void {
    this.busy.set(true);
    this.actionError.set(null);
    const filename = `documento-cobro-${c.numeroAseguradora || c.id}.pdf`;
    this.casosService.descargarDocumentoCobro(c.id, filename).subscribe({
      next: () => this.busy.set(false),
      error: (err) => {
        this.busy.set(false);
        this.actionError.set(err?.error?.message ?? 'No se pudo descargar el PDF');
      },
    });
  }

  puedeCerrar(): boolean {
    if (this.tipoFirma === 'TECNICO') return !!this.firmaTecnico();
    if (this.tipoFirma === 'ATENDIDO') return !!this.firmaAtendido();
    return !!this.firmaTecnico() && !!this.firmaAtendido();
  }

  cancelarCierre(): void {
    this.modoCerrar.set(false);
    this.firmaTecnico.set(null);
    this.firmaAtendido.set(null);
  }

  pedirAsignar(c: Caso): void {
    if (!this.tecnicoSelected) return;
    const tech = this.tecnicos().find((t) => t.id === this.tecnicoSelected);
    this.abrirConfirmacion({
      kind: 'asignar',
      fromLabel: this.labelEstado(c.estado),
      toLabel: this.labelEstado('Asignado'),
      lines: [
        `Caso: ${c.titulo}`,
        `Nº: ${c.numeroAseguradora}`,
        `Técnico: ${tech?.nombre ?? this.tecnicoSelected}`,
        `Dirección: ${c.direccion}, ${c.ciudad}`,
      ],
    });
  }

  pedirIniciar(c: Caso): void {
    this.abrirConfirmacion({
      kind: 'iniciar',
      fromLabel: this.labelEstado('Asignado'),
      toLabel: this.labelEstado('EnGestion'),
      lines: [
        `Caso: ${c.titulo}`,
        `Titular: ${c.titularNombre}`,
        `Dirección: ${c.direccion}, ${c.ciudad}`,
        'El técnico pasará a gestión en campo.',
      ],
    });
  }

  pedirCerrarCaso(c: Caso): void {
    if (!this.puedeCerrar()) return;
    const next = c.esGarantia ? 'CerradoGarantia' : 'PendienteDocumentoCobro';
    const firmaLabel =
      this.tipoFirma === 'TECNICO'
        ? 'Firma del técnico'
        : this.tipoFirma === 'ATENDIDO'
          ? 'Firma del atendido'
          : 'Firmas técnico + atendido';
    this.abrirConfirmacion({
      kind: 'cerrar',
      fromLabel: this.labelEstado('EnGestion'),
      toLabel: this.labelEstado(next),
      lines: [
        `Caso: ${c.titulo}`,
        `Fotos de evidencia: ${c.fotos.length}`,
        `Firma: ${firmaLabel}`,
        c.esGarantia
          ? 'Se cerrará la garantía (sin cobro).'
          : 'Pasará a documento oficial de cobro.',
      ],
    });
  }

  pedirMarcarEnviado(c: Caso): void {
    if (!c.lineasCobro.length) {
      this.actionError.set('Guarda líneas de cobro antes de marcar enviado');
      return;
    }
    this.abrirConfirmacion({
      kind: 'enviar',
      fromLabel: this.labelEstado('PendienteDocumentoCobro'),
      toLabel: this.labelEstado('PendienteConfirmacionAsegurado'),
      lines: this.resumenCobro(c, [
        'Se marcará el documento oficial como enviado.',
        'Revisa ítems y total antes de continuar.',
      ]),
    });
  }

  pedirConfirmarAsegurado(c: Caso): void {
    this.abrirConfirmacion({
      kind: 'confirmar',
      fromLabel: this.labelEstado('PendienteConfirmacionAsegurado'),
      toLabel: this.labelEstado('PendienteRecepcionPago'),
      lines: this.resumenCobro(c, ['El asegurado confirma el documento de cobro.']),
    });
  }

  pedirCobrar(c: Caso): void {
    this.abrirConfirmacion({
      kind: 'cobrar',
      fromLabel: this.labelEstado('PendienteRecepcionPago'),
      toLabel: this.labelEstado('Cobrado'),
      lines: this.resumenCobro(c, ['Se registrará el pago como recibido.']),
    });
  }

  pedirGarantia(c: Caso): void {
    const next = c.tecnicoId ? 'Asignado' : 'PendienteAsignacion';
    this.abrirConfirmacion({
      kind: 'garantia',
      fromLabel: this.labelEstado(c.estado),
      toLabel: this.labelEstado(next),
      lines: [
        `Caso: ${c.titulo}`,
        `Nº: ${c.numeroAseguradora}`,
        'Se reabre por garantía (sin cobro).',
        c.tecnicoId
          ? 'Quedará asignado al técnico actual para iniciar.'
          : 'Quedará pendiente de asignar técnico.',
      ],
    });
  }

  cerrarConfirmacion(): void {
    if (this.busy()) return;
    this.confirmOpen.set(null);
  }

  ejecutarConfirmacion(): void {
    const conf = this.confirmOpen();
    const c = this.caso();
    if (!conf || !c) return;

    const afterClose = () => this.confirmOpen.set(null);

    switch (conf.kind) {
      case 'asignar':
        this.run(() => this.casosService.asignar(c.id, this.tecnicoSelected), afterClose);
        break;
      case 'iniciar':
        this.run(() => this.casosService.iniciar(c.id), afterClose);
        break;
      case 'cerrar':
        this.run(
          () =>
            this.casosService.completar(c.id, {
              tipoFirma: this.tipoFirma,
              firmaTecnicoUrl: this.firmaTecnico() ?? undefined,
              firmaAtendidoUrl: this.firmaAtendido() ?? undefined,
            }),
          () => {
            this.firmaTecnico.set(null);
            this.firmaAtendido.set(null);
            this.modoCerrar.set(false);
            afterClose();
          },
        );
        break;
      case 'enviar':
        this.run(() => this.casosService.enviarDocumento(c.id), afterClose);
        break;
      case 'confirmar':
        this.run(() => this.casosService.confirmarAsegurado(c.id), afterClose);
        break;
      case 'cobrar':
        this.run(() => this.casosService.cobrar(c.id), afterClose);
        break;
      case 'garantia':
        this.run(() => this.casosService.abrirGarantia(c.id), afterClose);
        break;
    }
  }

  private abrirConfirmacion(payload: ConfirmEstadoPayload): void {
    this.actionError.set(null);
    this.confirmOpen.set(payload);
  }

  private resumenCobro(c: Caso, extras: string[] = []): string[] {
    const lineas = c.lineasCobro ?? [];
    const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
    const items = lineas.map(
      (l) =>
        `· ${l.nombre} × ${l.cantidad} ${l.unidad} = ${(l.cantidad * l.precioUnitario).toLocaleString('es-CO')}`,
    );
    return [
      `Caso: ${c.titulo}`,
      `Nº: ${c.numeroAseguradora} · ${c.aseguradora}`,
      `Titular: ${c.titularNombre}`,
      ...items,
      `Total: ${total.toLocaleString('es-CO')} COP`,
      ...extras,
    ];
  }

  subirFoto(c: Caso): void {
    if (!this.fotoUrl.trim()) {
      this.actionError.set('Indica una URL de foto');
      return;
    }
    this.run(() => this.casosService.addFoto(c.id, this.fotoUrl.trim()));
  }

  documentar(c: Caso): void {
    const nota = this.notaDocumentacion.trim();
    if (nota.length < 3) return;
    this.run(
      () => this.casosService.documentar(c.id, nota, this.fotoUrl.trim() || undefined),
      () => {
        this.notaDocumentacion = '';
      },
    );
  }

  private findItem(id: string): ItemCosto | undefined {
    if (!id) return undefined;
    for (const cat of this.catalogo()) {
      const found = cat.items.find((i) => i.id === id);
      if (found) return found;
    }
    return undefined;
  }

  private normalizeDraftLineas(): LineaCobro[] {
    return this.draftLineas
      .map((l) => ({
        ...l,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
      }))
      .filter((l) => l.cantidad > 0);
  }

  private syncDraftLineas(c: Caso): void {
    this.draftLineas = (c.lineasCobro ?? []).map((l) => ({ ...l }));
  }

  private applyMap(c: Caso): void {
    this.links = mapsLinks(c.direccion, c.ciudad, c.lat, c.lon);
    if (this.links.embed) {
      this.mapEmbedSafe.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.links.embed));
    } else {
      this.mapEmbedSafe.set(null);
    }
  }

  private run(fn: () => import('rxjs').Observable<Caso>, after?: () => void): void {
    this.busy.set(true);
    this.actionError.set(null);
    fn().subscribe({
      next: (updated) => {
        this.caso.set(updated);
        this.syncDraftLineas(updated);
        this.applyMap(updated);
        this.busy.set(false);
        after?.();
      },
      error: (err) => {
        this.busy.set(false);
        this.actionError.set(err?.error?.message ?? 'Acción fallida');
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.casosService.getById(id).subscribe({
      next: (c) => {
        this.caso.set(c);
        this.syncDraftLineas(c);
        this.applyMap(c);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar el caso');
      },
    });
  }
}
