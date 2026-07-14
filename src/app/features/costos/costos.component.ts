import { NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideFileDown,
  LucideFolderPlus,
  LucidePencil,
  LucidePlus,
  LucideSave,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { CostosService } from '../../core/services/costos.service';
import type { Aseguradora } from '../../core/models/catalogo.model';
import type { CategoriaConItems, ItemCosto, PlantillaPdfCobro } from '../../core/models/costo.model';
import { returnLabel, safeReturnTo } from '../../shared/nav-return';
import { CopPipe } from '../../shared/cop.pipe';
import { MoneyInputComponent } from '../../shared/money-input.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import {
  ConfirmDialogComponent,
  type ConfirmDialogPayload,
} from '../../shared/confirm-dialog.component';

type CatForm = { nombre: string; descripcion: string };
type ItemForm = {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precioSugerido: number | null;
  unidad: string;
  activo: boolean;
};
type CatalogForm = {
  nombre: string;
  nit: string;
  personaResponsable: string;
  contactoCobros: string;
  whatsapp: string;
  activa: boolean;
};
type TabId = 'tarifas' | 'pdf' | 'aseguradoras';

@Component({
  selector: 'app-costos',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideFileDown,
    LucideFolderPlus,
    LucidePencil,
    LucidePlus,
    LucideSave,
    LucideTrash2,
    LucideX,
    SkeletonComponent,
    ConfirmDialogComponent,
    CopPipe,
    MoneyInputComponent,
  ],
  template: `
    <main class="mx-auto max-w-6xl px-6 py-8">
      @if (returnTo(); as back) {
        <div class="mb-5">
          <a [routerLink]="back.path" [queryParams]="back.queryParams" class="btn-back">
            <svg lucideArrowLeft [size]="16"></svg>
            {{ back.label }}
          </a>
        </div>
      }
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-brand-ink">Admin</h1>
          <p class="mt-1 text-brand-soft/80">
            Catálogos y tarifas de {{ auth.currentUser?.empresaNombre }}: categorías de caso, ítems de
            costo, factura de cobro y clientes.
          </p>
        </div>
        @if (tab() === 'tarifas') {
          <button type="button" class="btn-primary" (click)="openCatCreate()">
            <svg lucideFolderPlus [size]="16"></svg>
            Nueva categoría
          </button>
        }
        @if (tab() === 'aseguradoras') {
          <button type="button" class="btn-primary" (click)="openAsegCreate()">
            <svg lucidePlus [size]="16"></svg>
            Nuevo cliente
          </button>
        }
      </div>

      <div class="mt-6 flex flex-wrap gap-2 border-b border-slate-200">
        <button
          type="button"
          class="tab-btn"
          [class.tab-active]="tab() === 'tarifas'"
          (click)="tab.set('tarifas')"
        >
          Tarifas
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.tab-active]="tab() === 'pdf'"
          (click)="openPdfTab()"
        >
          Factura de cobro
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.tab-active]="tab() === 'aseguradoras'"
          (click)="openAsegTab()"
        >
          Clientes
        </button>
      </div>

      @if (error()) {
        <p class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
      }

      @if (tab() === 'pdf') {
        <section class="mt-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-brand-ink">Factura para cobro</h2>
            <p class="mt-0.5 text-sm text-brand-soft/80">
              Una sola cabecera para todos los clientes. Si alguno pide datos extra, configúralos
              abajo sin cambiar el resto del documento.
            </p>
          </div>

          @if (plantillaLoading()) {
            <app-skeleton variant="costos-pdf" class="mt-6 block" />
          } @else if (plantillaForm) {
            <div class="grid gap-6 lg:grid-cols-2">
              <form class="space-y-5" (ngSubmit)="savePlantilla()">
                <div class="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <h3 class="text-sm font-semibold text-brand-ink">Cabecera (todas)</h3>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="block sm:col-span-2">
                      <span class="mb-1 block text-sm font-medium">Razón social *</span>
                      <input class="field" [(ngModel)]="plantillaForm.razonSocial" name="razon" required />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-sm font-medium">NIT *</span>
                      <input class="field" [(ngModel)]="plantillaForm.nit" name="nit" required />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-sm font-medium">Ciudad *</span>
                      <input class="field" [(ngModel)]="plantillaForm.ciudad" name="ciudad" required />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-sm font-medium">Teléfono *</span>
                      <input class="field" [(ngModel)]="plantillaForm.telefono" name="tel" required />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-sm font-medium">Email *</span>
                      <input
                        class="field"
                        type="email"
                        [(ngModel)]="plantillaForm.email"
                        name="email"
                        required
                      />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-sm font-medium">Color acento *</span>
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          class="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1"
                          [ngModel]="colorPickerValue()"
                          (ngModelChange)="onColorPicker($event)"
                          name="colorPicker"
                          title="Elegir color"
                          required
                        />
                        <input
                          class="field font-mono"
                          [(ngModel)]="plantillaForm.colorAcento"
                          name="color"
                          placeholder="#0f766e"
                          required
                        />
                      </div>
                      <p class="mt-1 text-[11px] text-slate-500">
                        Mismo formato de factura. Solo cambia el color.
                      </p>
                    </label>
                    <label class="block sm:col-span-2">
                      <span class="mb-1 block text-sm font-medium">Título del documento *</span>
                      <input
                        class="field"
                        [(ngModel)]="plantillaForm.textoHeader"
                        name="header"
                        required
                      />
                    </label>
                    <label class="block sm:col-span-2">
                      <span class="mb-1 block text-sm font-medium">Texto pie *</span>
                      <textarea
                        class="field min-h-[72px]"
                        [(ngModel)]="plantillaForm.textoFooter"
                        name="footer"
                        required
                      ></textarea>
                    </label>
                  </div>
                </div>

                <div class="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 class="text-sm font-semibold text-brand-ink">Extras por cliente</h3>
                      <p class="mt-0.5 text-xs text-brand-soft/80">
                        Opcional. Solo se agregan al PDF si ese cliente lo requiere.
                      </p>
                    </div>
                    <label class="block min-w-[200px]">
                      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cliente
                      </span>
                      <select
                        class="field"
                        [ngModel]="plantillaScopeId()"
                        (ngModelChange)="onPlantillaScope($event)"
                        name="plantillaScope"
                      >
                        <option value="">Ninguna (solo cabecera)</option>
                        @for (a of aseguradorasActivas(); track a.id) {
                          <option [value]="a.id">{{ a.nombre }}</option>
                        }
                      </select>
                    </label>
                  </div>

                  @if (plantillaScopeId()) {
                    <div class="grid gap-4 sm:grid-cols-2">
                      <label class="block sm:col-span-2">
                        <span class="mb-1 block text-sm font-medium">Destinatario / área</span>
                        <input
                          class="field"
                          [(ngModel)]="plantillaForm.extras.destinatario"
                          name="destinatario"
                          placeholder="Ej. Área de siniestros"
                        />
                      </label>
                      <label class="block sm:col-span-2">
                        <span class="mb-1 block text-sm font-medium">Código proveedor</span>
                        <input
                          class="field"
                          [(ngModel)]="plantillaForm.extras.codigoProveedor"
                          name="codigoProv"
                          placeholder="Si el cliente te asignó uno"
                        />
                      </label>
                      <label class="block sm:col-span-2">
                        <span class="mb-1 block text-sm font-medium">Nota adicional</span>
                        <textarea
                          class="field min-h-[72px]"
                          [(ngModel)]="plantillaForm.extras.notaAdicional"
                          name="notaExtra"
                          placeholder="Cláusula, convenio o texto que pidan"
                        ></textarea>
                      </label>
                    </div>
                    @if (plantillaForm.id) {
                      <button
                        type="button"
                        class="btn-ghost border border-red-200 text-red-700"
                        [disabled]="saving()"
                        (click)="deletePlantillaOverride()"
                      >
                        Quitar extras de este cliente
                      </button>
                    }
                  } @else {
                    <p class="text-sm text-slate-500">
                      Elige un cliente para agregar datos opcionales sin cambiar la cabecera.
                    </p>
                  }
                </div>

                <div class="flex flex-wrap justify-end gap-2">
                  @if (plantillaTieneCambiosSinGuardar()) {
                    <p class="mr-auto self-center text-sm text-amber-700">
                      Hay cambios sin guardar (p. ej. el color). Guarda antes de generar el PDF.
                    </p>
                  }
                  <button
                    type="button"
                    class="btn-ghost border border-slate-200"
                    [disabled]="previewingPdf() || !plantillaForm"
                    (click)="descargarPdfPrueba()"
                  >
                    @if (previewingPdf()) {
                      <span class="spinner"></span>
                      Generando…
                    } @else {
                      <svg lucideFileDown [size]="16"></svg>
                      PDF de prueba
                    }
                  </button>
                  <button type="submit" class="btn-primary" [disabled]="saving()">
                    @if (saving()) {
                      <span class="spinner"></span>
                      Guardando…
                    } @else {
                      <svg lucideSave [size]="16"></svg>
                      Guardar
                    }
                  </button>
                </div>
              </form>

              <!-- Vista previa HTML en vivo -->
              <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vista previa · Factura para cobro
                    @if (scopeAseguradoraNombre()) {
                      <span class="font-normal normal-case text-slate-400">
                        · con extras de {{ scopeAseguradoraNombre() }}
                      </span>
                    }
                  </p>
                  <button
                    type="button"
                    class="btn-ghost border border-slate-200 !px-2.5 !py-1.5 text-xs"
                    [disabled]="previewingPdf() || !plantillaForm"
                    (click)="descargarPdfPrueba()"
                  >
                    @if (previewingPdf()) {
                      <span class="spinner"></span>
                    } @else {
                      <svg lucideFileDown [size]="14"></svg>
                    }
                    Descargar PDF
                  </button>
                </div>
                <div
                  class="invoice-preview overflow-hidden rounded-md bg-white shadow-soft"
                  [style.border-top]="'2px solid ' + (plantillaForm.colorAcento || '#0f766e')"
                >
                  <div class="space-y-3 p-5 text-[11px] leading-relaxed text-slate-700 sm:text-xs">
                    <div>
                      <p class="text-base font-bold" [style.color]="'#071422'">
                        {{ plantillaForm.razonSocial || 'Razón social' }}
                      </p>
                      <p class="text-slate-500">
                        NIT {{ plantillaForm.nit || '—' }} · {{ plantillaForm.ciudad || '—' }} ·
                        {{ plantillaForm.telefono || '—' }}
                      </p>
                      <p class="text-slate-500">{{ plantillaForm.email || '—' }}</p>
                    </div>

                    <p
                      class="text-sm font-bold"
                      [style.color]="plantillaForm.colorAcento || '#0f766e'"
                    >
                      {{ plantillaForm.textoHeader || 'Factura para cobro' }}
                    </p>

                    <div class="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600">
                      <p><strong>Caso:</strong> Inspección demo — vista previa</p>
                      <p>
                        <strong>Nº:</strong> PREV-001
                        @if (scopeAseguradoraNombre()) {
                          · {{ scopeAseguradoraNombre() }}
                        }
                      </p>
                      <p><strong>Titular:</strong> Cliente de ejemplo</p>
                      <p><strong>Dirección:</strong> Calle 100 #19-50, Bogotá</p>
                    </div>

                    @if (tieneExtrasPreview()) {
                      <div
                        class="rounded border px-3 py-2"
                        [style.borderColor]="plantillaForm.colorAcento || '#0f766e'"
                        [style.background]="(plantillaForm.colorAcento || '#0f766e') + '12'"
                      >
                        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Datos adicionales
                        </p>
                        @if (plantillaForm.extras.destinatario) {
                          <p><strong>Destinatario:</strong> {{ plantillaForm.extras.destinatario }}</p>
                        }
                        @if (plantillaForm.extras.codigoProveedor) {
                          <p>
                            <strong>Código proveedor:</strong>
                            {{ plantillaForm.extras.codigoProveedor }}
                          </p>
                        }
                        @if (plantillaForm.extras.notaAdicional) {
                          <p class="mt-1 text-slate-600">{{ plantillaForm.extras.notaAdicional }}</p>
                        }
                      </div>
                    }

                    <table class="w-full border-collapse text-left">
                      <thead>
                        <tr
                          class="text-[10px] uppercase text-white"
                          [style.background]="plantillaForm.colorAcento || '#0f766e'"
                        >
                          <th class="px-2 py-1.5">#</th>
                          <th class="px-2 py-1.5">Descripción</th>
                          <th class="px-2 py-1.5 text-right">Cant.</th>
                          <th class="px-2 py-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-50 bg-slate-50">
                          <td class="px-2 py-1.5">1</td>
                          <td class="px-2 py-1.5">Visita técnica</td>
                          <td class="px-2 py-1.5 text-right tabular-nums">1</td>
                          <td class="px-2 py-1.5 text-right tabular-nums">$120.000</td>
                        </tr>
                        <tr class="border-b border-slate-50">
                          <td class="px-2 py-1.5">2</td>
                          <td class="px-2 py-1.5">Destape de desagüe</td>
                          <td class="px-2 py-1.5 text-right tabular-nums">1</td>
                          <td class="px-2 py-1.5 text-right tabular-nums">$180.000</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="text-right text-sm font-bold text-brand-ink">Total $300.000</p>

                    <p class="border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                      {{ plantillaForm.textoFooter || 'Pie de documento' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        </section>
      } @else if (tab() === 'aseguradoras') {
        <section class="mt-6">
          @if (catalogLoading()) {
            <app-skeleton variant="costos-tarifas" [rows]="4" />
          } @else {
            <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
              <table class="w-full min-w-[720px] text-left text-sm">
                <thead class="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <tr>
                    <th class="px-4 py-2.5 font-semibold">Nombre</th>
                    <th class="px-4 py-2.5 font-semibold">NIT</th>
                    <th class="px-4 py-2.5 font-semibold">Responsable</th>
                    <th class="px-4 py-2.5 font-semibold">Cobros / dudas</th>
                    <th class="px-4 py-2.5 font-semibold">WhatsApp</th>
                    <th class="px-4 py-2.5 font-semibold">Estado</th>
                    <th class="px-4 py-2.5 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of aseguradoras(); track a.id) {
                    <tr class="border-t border-slate-100">
                      <td class="px-4 py-2.5 font-medium text-brand-ink">{{ a.nombre }}</td>
                      <td class="px-4 py-2.5 text-brand-soft tabular-nums">{{ a.nit || '—' }}</td>
                      <td class="px-4 py-2.5 text-brand-soft">{{ a.personaResponsable || '—' }}</td>
                      <td class="px-4 py-2.5 text-brand-soft">{{ a.contactoCobros || '—' }}</td>
                      <td class="px-4 py-2.5 text-brand-soft tabular-nums">
                        @if (a.whatsapp) {
                          <a
                            class="text-accent underline"
                            [href]="whatsappHref(a.whatsapp)"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {{ a.whatsapp }}
                          </a>
                        } @else {
                          —
                        }
                      </td>
                      <td class="px-4 py-2.5">
                        <span class="badge" [ngClass]="a.activa ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'">
                          {{ a.activa ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <button type="button" class="icon-btn" (click)="openAsegEdit(a)" aria-label="Editar">
                          <svg lucidePencil [size]="15"></svg>
                        </button>
                        <button
                          type="button"
                          class="icon-btn text-red-600"
                          [disabled]="deletingId() === a.id"
                          (click)="deleteAseguradora(a)"
                          aria-label="Eliminar"
                        >
                          <svg lucideTrash2 [size]="15"></svg>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                        Sin clientes.
                        @if (showDemoReseedCta()) {
                          <span class="mt-2 block text-sm">
                            <a routerLink="/perfil" class="font-semibold text-accent underline"
                              >Reiniciar datos DEMO</a
                            >
                            desde Perfil (Owner).
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      } @else if (loading()) {
        <app-skeleton variant="costos-tarifas" />
      } @else {
        <p class="mt-6 text-sm text-brand-soft/80">
          Las <span class="font-medium text-brand-ink">categorías</span> aparecen al crear un caso.
          Los <span class="font-medium text-brand-ink">ítems</span> de cada una son las tarifas que
          se usan al armar el cobro.
        </p>
        <!-- Category chips -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="chip"
            [class.chip-active]="!filtroCat()"
            (click)="filtroCat.set(null)"
          >
            Todas ({{ totalItems() }})
          </button>
          @for (c of categorias(); track c.id) {
            <button
              type="button"
              class="chip"
              [class.chip-active]="filtroCat() === c.id"
              (click)="filtroCat.set(c.id)"
            >
              {{ c.nombre }} ({{ c.items.length }})
            </button>
          }
        </div>

        <div class="mt-6 space-y-6">
          @for (cat of categoriasVisibles(); track cat.id) {
            <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 class="text-lg font-semibold text-brand-ink">{{ cat.nombre }}</h2>
                  @if (cat.descripcion) {
                    <p class="mt-0.5 text-sm text-brand-soft/80">{{ cat.descripcion }}</p>
                  }
                </div>
                <div class="flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="btn-primary !px-2.5 !py-1.5 text-sm"
                    (click)="openItemCreate(cat.id)"
                    title="Agregar ítem"
                  >
                    <svg lucidePlus [size]="15"></svg>
                    Ítem
                  </button>
                  <button
                    type="button"
                    class="icon-btn"
                    (click)="openCatEdit(cat)"
                    title="Editar categoría"
                    aria-label="Editar categoría"
                  >
                    <svg lucidePencil [size]="15"></svg>
                  </button>
                  <button
                    type="button"
                    class="icon-btn icon-btn-danger"
                    [disabled]="!!deletingId()"
                    (click)="confirmDeleteCat(cat)"
                    title="Eliminar categoría"
                    aria-label="Eliminar categoría"
                  >
                    @if (deletingId() === cat.id) {
                      <span class="spinner spinner-sm"></span>
                    } @else {
                      <svg lucideTrash2 [size]="15"></svg>
                    }
                  </button>
                </div>
              </div>

              @if (cat.items.length === 0) {
                <p class="px-4 py-6 text-sm text-slate-500">
                  Sin ítems. Agrega cargos como tubería, destapes, cambios, etc.
                </p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-white text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <tr>
                        <th class="px-4 py-2.5 font-semibold">Ítem</th>
                        <th class="px-4 py-2.5 font-semibold">Unidad</th>
                        <th class="px-4 py-2.5 font-semibold">Precio sugerido</th>
                        <th class="px-4 py-2.5 font-semibold">Estado</th>
                        <th class="px-4 py-2.5 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of cat.items; track item.id) {
                        <tr class="border-t border-slate-100">
                          <td class="px-4 py-3">
                            <p class="font-medium text-brand-ink">{{ item.nombre }}</p>
                            @if (item.descripcion) {
                              <p class="text-xs text-slate-500">{{ item.descripcion }}</p>
                            }
                          </td>
                          <td class="px-4 py-3 text-brand-soft">{{ item.unidad }}</td>
                          <td class="px-4 py-3 text-brand-soft">
                            {{ item.precioSugerido | cop }}
                          </td>
                          <td class="px-4 py-3">
                            <span
                              class="badge"
                              [ngClass]="
                                item.activo
                                  ? 'bg-accent-soft text-accent'
                                  : 'bg-slate-100 text-slate-600'
                              "
                            >
                              {{ item.activo ? 'Activo' : 'Inactivo' }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              class="icon-btn"
                              (click)="openItemEdit(item)"
                              title="Editar ítem"
                              aria-label="Editar ítem"
                            >
                              <svg lucidePencil [size]="15"></svg>
                            </button>
                            <button
                              type="button"
                              class="icon-btn icon-btn-danger"
                              [disabled]="!!deletingId()"
                              (click)="confirmDeleteItem(item)"
                              title="Eliminar ítem"
                              aria-label="Eliminar ítem"
                            >
                              @if (deletingId() === item.id) {
                                <span class="spinner spinner-sm"></span>
                              } @else {
                                <svg lucideTrash2 [size]="15"></svg>
                              }
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          } @empty {
            <p class="rounded-lg border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-brand-soft">
              No hay categorías. Crea la primera (Plomería, Electricidad…).
            </p>
          }
        </div>
      }

      <!-- Modal categoría -->
      @if (catModal()) {
        <div class="modal-backdrop" (click)="closeCatModal()">
          <div class="modal-panel" (click)="$event.stopPropagation()" role="dialog">
            <h3 class="text-lg font-semibold text-brand-ink">
              {{ editingCatId() ? 'Editar categoría' : 'Nueva categoría' }}
            </h3>
            <form class="mt-4 space-y-4" (ngSubmit)="saveCategoria()">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nombre *</span>
                <input
                  class="field"
                  [(ngModel)]="catForm.nombre"
                  name="catNombre"
                  required
                  placeholder="Ej. Plomería, Electricidad…"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Descripción *</span>
                <input
                  class="field"
                  [(ngModel)]="catForm.descripcion"
                  name="catDesc"
                  required
                  placeholder="Ej. Tuberías, destapes y fugas"
                />
              </label>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="btn-ghost" (click)="closeCatModal()">
                  <svg lucideX [size]="15"></svg>
                  Cancelar
                </button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner"></span>
                    Guardando…
                  } @else {
                    <svg lucideSave [size]="16"></svg>
                    Guardar
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal ítem -->
      @if (itemModal()) {
        <div class="modal-backdrop" (click)="closeItemModal()">
          <div class="modal-panel" (click)="$event.stopPropagation()" role="dialog">
            <h3 class="text-lg font-semibold text-brand-ink">
              {{ editingItemId() ? 'Editar ítem' : 'Nuevo ítem de costo' }}
            </h3>
            <form class="mt-4 space-y-4" (ngSubmit)="saveItem()">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Categoría *</span>
                <select class="field" [(ngModel)]="itemForm.categoriaId" name="itemCat" required>
                  @for (c of categorias(); track c.id) {
                    <option [value]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nombre *</span>
                <input
                  class="field"
                  [(ngModel)]="itemForm.nombre"
                  name="itemNombre"
                  required
                  placeholder='Ej. Tubería de 1/4", Cambio de sifón…'
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Descripción *</span>
                <input
                  class="field"
                  [(ngModel)]="itemForm.descripcion"
                  name="itemDesc"
                  required
                  placeholder="Qué incluye el ítem"
                />
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Precio sugerido *</span>
                  <app-money-input
                    name="itemPrecio"
                    placeholder="Ej. $ 45.000"
                    [(ngModel)]="itemForm.precioSugerido"
                    [required]="true"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Unidad *</span>
                  <select class="field" [(ngModel)]="itemForm.unidad" name="itemUnidad" required>
                    <option value="und">und</option>
                    <option value="metro">metro</option>
                    <option value="ml">ml</option>
                    <option value="servicio">servicio</option>
                  </select>
                </label>
              </div>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [(ngModel)]="itemForm.activo" name="itemActivo" />
                Activo
              </label>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="btn-ghost" (click)="closeItemModal()">
                  <svg lucideX [size]="15"></svg>
                  Cancelar
                </button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner"></span>
                    Guardando…
                  } @else {
                    <svg lucideSave [size]="16"></svg>
                    Guardar
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal catálogo (aseguradora) -->
      @if (catalogModal()) {
        <div class="modal-backdrop" (click)="closeCatalogModal()">
          <div class="modal-panel modal-panel-wide" (click)="$event.stopPropagation()" role="dialog">
            <h3 class="text-lg font-semibold text-brand-ink">
              {{ editingCatalogId() ? 'Editar cliente' : 'Nuevo cliente' }}
            </h3>
            <form class="mt-4 space-y-4" (ngSubmit)="saveCatalog()">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nombre *</span>
                <input class="field" [(ngModel)]="catalogForm.nombre" name="catNombre" required />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">NIT *</span>
                <input
                  class="field"
                  [(ngModel)]="catalogForm.nit"
                  name="catNit"
                  required
                  placeholder="NIT del cliente"
                />
              </label>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Contactos</p>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Persona responsable *</span>
                <input
                  class="field"
                  [(ngModel)]="catalogForm.personaResponsable"
                  name="catResponsable"
                  required
                  placeholder="Nombre del contacto"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Contacto cobros / dudas *</span>
                <input
                  class="field"
                  [(ngModel)]="catalogForm.contactoCobros"
                  name="catCobros"
                  required
                  placeholder="Email o teléfono para cobros"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">WhatsApp *</span>
                <input
                  class="field"
                  [(ngModel)]="catalogForm.whatsapp"
                  name="catWhatsapp"
                  required
                  placeholder="+57 300 000 0000"
                />
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [(ngModel)]="catalogForm.activa" name="catActiva" />
                Activa
              </label>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="btn-ghost" (click)="closeCatalogModal()">
                  <svg lucideX [size]="15"></svg>
                  Cancelar
                </button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner"></span>
                    Guardando…
                  } @else {
                    <svg lucideSave [size]="16"></svg>
                    Guardar
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <app-confirm-dialog
        [payload]="confirmDialog()"
        [busy]="!!deletingId() || saving()"
        (cancelled)="cerrarConfirmDialog()"
        (confirmed)="ejecutarConfirmDialog()"
      />
    </main>
  `,
  styles: [
    `
      .chip {
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--brand-soft);
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }
      .chip:hover {
        background: var(--surface-muted);
      }
      .chip-active {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
      }
      .field {
        width: 100%;
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        background: white;
        padding: 0.625rem 0.75rem;
        outline: none;
      }
      .field:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgb(15 118 110 / 0.2);
      }
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
      .modal-panel-wide {
        max-width: 32rem;
      }
      .tab-btn {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--brand-soft);
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .tab-active {
        color: var(--accent);
        border-bottom-color: var(--accent);
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
export class CostosComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly costos = inject(CostosService);
  private readonly catalogos = inject(CatalogosService);
  private readonly route = inject(ActivatedRoute);

  readonly returnTo = signal<{
    path: string;
    queryParams: Record<string, string>;
    label: string;
  } | null>(null);

  readonly tab = signal<TabId>('tarifas');
  readonly loading = signal(true);
  readonly catalogLoading = signal(false);
  readonly plantillaLoading = signal(false);
  readonly previewingPdf = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  /** Confirmación in-app (reemplaza window.confirm). */
  readonly confirmDialog = signal<ConfirmDialogPayload | null>(null);
  private pendingConfirm: (() => void) | null = null;
  readonly categorias = signal<CategoriaConItems[]>([]);
  readonly aseguradoras = signal<Aseguradora[]>([]);
  /** '' = plantilla general; otherwise aseguradora id */
  readonly plantillaScopeId = signal('');
  readonly filtroCat = signal<string | null>(null);

  readonly catModal = signal(false);
  readonly itemModal = signal(false);
  readonly catalogModal = signal(false);
  readonly editingCatId = signal<string | null>(null);
  readonly editingItemId = signal<string | null>(null);
  readonly editingCatalogId = signal<string | null>(null);

  plantillaForm: PlantillaPdfCobro | null = null;
  /** Snapshot de lo último guardado/cargado; si difiere del form, hay que Guardar antes del PDF. */
  private plantillaSavedSnapshot: string | null = null;

  catForm: CatForm = { nombre: '', descripcion: '' };
  itemForm: ItemForm = {
    categoriaId: '',
    nombre: '',
    descripcion: '',
    precioSugerido: null,
    unidad: 'und',
    activo: true,
  };
  catalogForm: CatalogForm = {
    nombre: '',
    nit: '',
    personaResponsable: '',
    contactoCobros: '',
    whatsapp: '',
    activa: true,
  };

  readonly categoriasVisibles = computed(() => {
    const id = this.filtroCat();
    const all = this.categorias();
    return id ? all.filter((c) => c.id === id) : all;
  });

  readonly totalItems = computed(() =>
    this.categorias().reduce((n, c) => n + c.items.length, 0),
  );

  readonly aseguradorasActivas = computed(() =>
    this.aseguradoras().filter((a) => a.activa),
  );

  readonly scopeAseguradoraNombre = computed(() => {
    const id = this.plantillaScopeId();
    if (!id) return '';
    return this.aseguradoras().find((a) => a.id === id)?.nombre ?? '';
  });

  tieneExtrasPreview(): boolean {
    const e = this.plantillaForm?.extras;
    if (!e) return false;
    return Boolean(
      e.destinatario?.trim() || e.codigoProveedor?.trim() || e.notaAdicional?.trim(),
    );
  }

  /** Valor seguro para `<input type="color">` (requiere #rrggbb). */
  colorPickerValue(): string {
    const raw = (this.plantillaForm?.colorAcento || '#0f766e').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      const h = raw.slice(1);
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }
    return '#0f766e';
  }

  onColorPicker(hex: string): void {
    if (!this.plantillaForm) return;
    this.plantillaForm.colorAcento = hex;
  }

  /** Campos de plantilla que afectan el PDF (comparados vs último guardado). */
  private plantillaSnapshotPayload(p: PlantillaPdfCobro): string {
    return JSON.stringify({
      razonSocial: p.razonSocial?.trim() ?? '',
      nit: p.nit?.trim() ?? '',
      ciudad: p.ciudad?.trim() ?? '',
      telefono: p.telefono?.trim() ?? '',
      email: p.email?.trim() ?? '',
      colorAcento: (p.colorAcento || '').trim().toLowerCase(),
      textoHeader: p.textoHeader?.trim() ?? '',
      textoFooter: p.textoFooter?.trim() ?? '',
      extras: {
        destinatario: p.extras?.destinatario?.trim() ?? '',
        codigoProveedor: p.extras?.codigoProveedor?.trim() ?? '',
        notaAdicional: p.extras?.notaAdicional?.trim() ?? '',
      },
    });
  }

  private rememberPlantillaSaved(p: PlantillaPdfCobro): void {
    this.plantillaSavedSnapshot = this.plantillaSnapshotPayload(p);
  }

  plantillaTieneCambiosSinGuardar(): boolean {
    if (!this.plantillaForm || !this.plantillaSavedSnapshot) return false;
    return this.plantillaSnapshotPayload(this.plantillaForm) !== this.plantillaSavedSnapshot;
  }

  /** CTA Perfil → Reiniciar datos DEMO (Owner DEMO). */
  showDemoReseedCta(): boolean {
    const u = this.auth.currentUser;
    if (!u || u.role !== 'ADMIN' || !u.esOwner) return false;
    return (u.empresaNombre ?? '').toUpperCase() === 'DEMO';
  }

  ngOnInit(): void {
    const back = safeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'));
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
    this.reload();
  }

  openPdfTab(): void {
    this.tab.set('pdf');
    this.ensureAseguradorasLoaded(() => {
      this.loadPlantilla(this.plantillaScopeId() || null);
    });
  }

  openAsegTab(): void {
    this.tab.set('aseguradoras');
    this.loadAseguradoras();
  }

  ensureAseguradorasLoaded(done?: () => void): void {
    if (this.aseguradoras().length) {
      done?.();
      return;
    }
    this.catalogos.getAseguradoras(true).subscribe({
      next: (rows) => {
        this.aseguradoras.set(rows);
        done?.();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudieron cargar clientes');
        done?.();
      },
    });
  }

  loadAseguradoras(): void {
    this.catalogLoading.set(true);
    this.catalogos.getAseguradoras(true).subscribe({
      next: (rows) => {
        this.aseguradoras.set(rows);
        this.catalogLoading.set(false);
      },
      error: (err) => {
        this.catalogLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar clientes');
      },
    });
  }

  onPlantillaScope(value: string): void {
    this.plantillaScopeId.set(value ?? '');
    this.loadPlantilla(value || null);
  }

  openAsegCreate(): void {
    this.editingCatalogId.set(null);
    this.catalogForm = {
      nombre: '',
      nit: '',
      personaResponsable: '',
      contactoCobros: '',
      whatsapp: '',
      activa: true,
    };
    this.catalogModal.set(true);
  }

  openAsegEdit(a: Aseguradora): void {
    this.editingCatalogId.set(a.id);
    this.catalogForm = {
      nombre: a.nombre,
      nit: a.nit ?? '',
      personaResponsable: a.personaResponsable ?? '',
      contactoCobros: a.contactoCobros ?? '',
      whatsapp: a.whatsapp ?? '',
      activa: a.activa,
    };
    this.catalogModal.set(true);
  }

  closeCatalogModal(): void {
    this.catalogModal.set(false);
  }

  saveCatalog(): void {
    if (!this.catalogModal()) return;
    const nombre = this.catalogForm.nombre.trim();
    const nit = this.catalogForm.nit.trim();
    const personaResponsable = this.catalogForm.personaResponsable.trim();
    const contactoCobros = this.catalogForm.contactoCobros.trim();
    const whatsapp = this.catalogForm.whatsapp.trim();
    if (!nombre || !nit || !personaResponsable || !contactoCobros || !whatsapp) {
      this.error.set('Completa todos los campos del cliente');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const id = this.editingCatalogId();
    const payload = {
      nombre,
      nit,
      personaResponsable,
      contactoCobros,
      whatsapp,
      activa: this.catalogForm.activa,
    };
    const req = id
      ? this.catalogos.updateAseguradora(id, payload)
      : this.catalogos.createAseguradora(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCatalogModal();
        this.loadAseguradoras();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el cliente');
      },
    });
  }

  deleteAseguradora(a: Aseguradora): void {
    this.pedirConfirmacion(
      {
        title: '¿Eliminar cliente?',
        lines: [
          `Cliente: ${a.nombre}`,
          'Se quitará del catálogo. No se eliminan casos históricos.',
        ],
        confirmLabel: 'Eliminar',
        danger: true,
      },
      () => {
        this.deletingId.set(a.id);
        this.catalogos.deleteAseguradora(a.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            this.loadAseguradoras();
          },
          error: (err) => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            this.error.set(err?.error?.message ?? 'No se pudo eliminar');
          },
        });
      },
    );
  }

  /** Abre chat de WhatsApp (solo dígitos, con código país si viene). */
  whatsappHref(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  }

  loadPlantilla(aseguradoraId?: string | null): void {
    this.plantillaLoading.set(true);
    this.costos.getPlantillaPdf(aseguradoraId ?? null).subscribe({
      next: (p) => {
        this.plantillaForm = {
          ...p,
          extras: {
            destinatario: p.extras?.destinatario ?? '',
            codigoProveedor: p.extras?.codigoProveedor ?? '',
            notaAdicional: p.extras?.notaAdicional ?? '',
          },
        };
        this.rememberPlantillaSaved(this.plantillaForm);
        this.plantillaLoading.set(false);
      },
      error: (err) => {
        this.plantillaLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar la plantilla PDF');
      },
    });
  }

  private plantillaCabeceraCompleta(): boolean {
    const f = this.plantillaForm;
    if (!f) return false;
    return Boolean(
      f.razonSocial?.trim() &&
        f.nit?.trim() &&
        f.ciudad?.trim() &&
        f.telefono?.trim() &&
        f.email?.trim() &&
        f.colorAcento?.trim() &&
        f.textoHeader?.trim() &&
        f.textoFooter?.trim(),
    );
  }

  savePlantilla(): void {
    if (!this.plantillaForm) return;
    if (!this.plantillaCabeceraCompleta()) {
      this.error.set('Completa todos los campos de la cabecera de la factura');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const scope = this.plantillaScopeId() || null;
    const {
      razonSocial,
      nit,
      ciudad,
      telefono,
      email,
      colorAcento,
      textoHeader,
      textoFooter,
      extras,
    } = this.plantillaForm;
    this.costos
      .updatePlantillaPdf({
        aseguradoraId: scope,
        razonSocial,
        nit,
        ciudad,
        telefono,
        email,
        colorAcento,
        textoHeader,
        textoFooter,
        tipoPlantilla: 'tabla_operativa',
        ...(scope
          ? {
              extras: {
                destinatario: extras.destinatario ?? '',
                codigoProveedor: extras.codigoProveedor ?? '',
                notaAdicional: extras.notaAdicional ?? '',
              },
            }
          : {}),
      })
      .subscribe({
        next: (p) => {
          this.plantillaForm = {
            ...p,
            extras: {
              destinatario: p.extras?.destinatario ?? '',
              codigoProveedor: p.extras?.codigoProveedor ?? '',
              notaAdicional: p.extras?.notaAdicional ?? '',
            },
          };
          this.rememberPlantillaSaved(this.plantillaForm);
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo guardar la plantilla');
        },
      });
  }

  deletePlantillaOverride(): void {
    const p = this.plantillaForm;
    if (!p?.id || !this.plantillaScopeId()) return;
    this.pedirConfirmacion(
      {
        title: '¿Quitar extras de cliente?',
        lines: [
          'Se eliminan solo los extras de este cliente.',
          'La cabecera unificada no cambia.',
        ],
        confirmLabel: 'Quitar extras',
        danger: true,
      },
      () => {
        this.saving.set(true);
        this.costos.deletePlantillaPdf(p.id).subscribe({
          next: () => {
            this.saving.set(false);
            this.cerrarConfirmDialog();
            this.loadPlantilla(this.plantillaScopeId() || null);
          },
          error: (err) => {
            this.saving.set(false);
            this.cerrarConfirmDialog();
            this.error.set(err?.error?.message ?? 'No se pudieron quitar los extras');
          },
        });
      },
    );
  }

  descargarPdfPrueba(): void {
    if (!this.plantillaForm) return;
    if (this.plantillaTieneCambiosSinGuardar()) {
      this.error.set(
        'Debes guardar los cambios (incluido el color) antes de generar el nuevo PDF.',
      );
      return;
    }
    this.previewingPdf.set(true);
    this.error.set(null);
    const scope = this.plantillaScopeId() || null;
    const f = this.plantillaForm;
    this.costos
      .descargarPreviewPdf({
        aseguradoraId: scope,
        razonSocial: f.razonSocial,
        nit: f.nit,
        ciudad: f.ciudad,
        telefono: f.telefono,
        email: f.email,
        colorAcento: f.colorAcento,
        textoHeader: f.textoHeader,
        textoFooter: f.textoFooter,
        tipoPlantilla: 'tabla_operativa',
        extras: scope
          ? {
              destinatario: f.extras.destinatario ?? '',
              codigoProveedor: f.extras.codigoProveedor ?? '',
              notaAdicional: f.extras.notaAdicional ?? '',
            }
          : undefined,
      })
      .subscribe({
        next: () => this.previewingPdf.set(false),
        error: (err) => {
          this.previewingPdf.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo generar el PDF de prueba');
        },
      });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.costos.listTree().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar los costos');
      },
    });
  }

  openCatCreate(): void {
    this.editingCatId.set(null);
    this.catForm = { nombre: '', descripcion: '' };
    this.catModal.set(true);
  }

  openCatEdit(cat: CategoriaConItems): void {
    this.editingCatId.set(cat.id);
    this.catForm = { nombre: cat.nombre, descripcion: cat.descripcion };
    this.catModal.set(true);
  }

  closeCatModal(): void {
    this.catModal.set(false);
  }

  saveCategoria(): void {
    const nombre = this.catForm.nombre.trim();
    const descripcion = this.catForm.descripcion.trim();
    if (!nombre || !descripcion) {
      this.error.set('Nombre y descripción de la categoría son obligatorios');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const payload = { nombre, descripcion };
    const id = this.editingCatId();
    const req = id
      ? this.costos.updateCategoria(id, payload)
      : this.costos.createCategoria(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCatModal();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar la categoría');
      },
    });
  }

  confirmDeleteCat(cat: CategoriaConItems): void {
    const lines =
      cat.items.length > 0
        ? [
            `Categoría: ${cat.nombre}`,
            `También se eliminarán ${cat.items.length} ítem(s) asociados.`,
          ]
        : [`Categoría: ${cat.nombre}`, 'No tiene ítems asociados.'];

    this.pedirConfirmacion(
      {
        title: '¿Eliminar categoría?',
        lines,
        confirmLabel: 'Eliminar',
        danger: true,
      },
      () => {
        this.deletingId.set(cat.id);
        this.costos.deleteCategoria(cat.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            if (this.filtroCat() === cat.id) this.filtroCat.set(null);
            this.reload();
          },
          error: (err) => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            this.error.set(err?.error?.message ?? 'No se pudo eliminar la categoría');
          },
        });
      },
    );
  }

  openItemCreate(categoriaId: string): void {
    this.editingItemId.set(null);
    this.itemForm = {
      categoriaId,
      nombre: '',
      descripcion: '',
      precioSugerido: null,
      unidad: 'und',
      activo: true,
    };
    this.itemModal.set(true);
  }

  openItemEdit(item: ItemCosto): void {
    this.editingItemId.set(item.id);
    this.itemForm = {
      categoriaId: item.categoriaId,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precioSugerido: item.precioSugerido,
      unidad: item.unidad,
      activo: item.activo,
    };
    this.itemModal.set(true);
  }

  closeItemModal(): void {
    this.itemModal.set(false);
  }

  saveItem(): void {
    const nombre = this.itemForm.nombre.trim();
    const descripcion = this.itemForm.descripcion.trim();
    const unidad = this.itemForm.unidad.trim();
    if (!nombre || !descripcion || !unidad || !this.itemForm.categoriaId) {
      this.error.set('Completa todos los campos del ítem');
      return;
    }
    if (this.itemForm.precioSugerido == null) {
      this.error.set('Precio sugerido es obligatorio');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const payload = {
      categoriaId: this.itemForm.categoriaId,
      nombre,
      descripcion,
      precioSugerido: Number(this.itemForm.precioSugerido),
      unidad,
      activo: this.itemForm.activo,
    };
    const id = this.editingItemId();
    const req = id
      ? this.costos.updateItem(id, payload)
      : this.costos.createItem(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeItemModal();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el ítem');
      },
    });
  }

  confirmDeleteItem(item: ItemCosto): void {
    this.pedirConfirmacion(
      {
        title: '¿Eliminar ítem?',
        lines: [`Ítem: ${item.nombre}`, 'Se quitará del catálogo de tarifas.'],
        confirmLabel: 'Eliminar',
        danger: true,
      },
      () => {
        this.deletingId.set(item.id);
        this.costos.deleteItem(item.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            this.reload();
          },
          error: (err) => {
            this.deletingId.set(null);
            this.cerrarConfirmDialog();
            this.error.set(err?.error?.message ?? 'No se pudo eliminar el ítem');
          },
        });
      },
    );
  }

  private pedirConfirmacion(payload: ConfirmDialogPayload, onConfirm: () => void): void {
    this.pendingConfirm = onConfirm;
    this.confirmDialog.set(payload);
  }

  cerrarConfirmDialog(): void {
    this.confirmDialog.set(null);
    this.pendingConfirm = null;
  }

  ejecutarConfirmDialog(): void {
    this.pendingConfirm?.();
  }
}
