import { DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideFolderPlus,
  LucidePencil,
  LucidePlus,
  LucideSave,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { CostosService } from '../../core/services/costos.service';
import type { CategoriaConItems, ItemCosto, PlantillaPdfCobro } from '../../core/models/costo.model';
import { returnLabel, safeReturnTo } from '../../shared/nav-return';
import { SkeletonComponent } from '../../shared/skeleton.component';

type CatForm = { nombre: string; descripcion: string };
type ItemForm = {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  costoInterno: number | null;
  precioSugerido: number | null;
  unidad: string;
  activo: boolean;
};
type TabId = 'tarifas' | 'pdf';

@Component({
  selector: 'app-costos',
  standalone: true,
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideFolderPlus,
    LucidePencil,
    LucidePlus,
    LucideSave,
    LucideTrash2,
    LucideX,
    SkeletonComponent,
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
          <h1 class="text-3xl font-semibold text-brand-ink">Costos por servicio</h1>
          <p class="mt-1 text-brand-soft/80">
            Tarifas y documento PDF de {{ auth.currentUser?.empresaNombre }}.
          </p>
        </div>
        @if (tab() === 'tarifas') {
          <button type="button" class="btn-primary" (click)="openCatCreate()">
            <svg lucideFolderPlus [size]="16"></svg>
            Nueva categoría
          </button>
        }
      </div>

      <div class="mt-6 flex gap-2 border-b border-slate-200">
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
          PDF a generar
        </button>
      </div>

      @if (error()) {
        <p class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
      }

      @if (tab() === 'pdf') {
        <section class="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <h2 class="text-lg font-semibold text-brand-ink">Plantilla del documento de cobro</h2>
          <p class="mt-1 text-sm text-brand-soft/80">
            Define cómo se ve el PDF al enviar el documento oficial. Full usa tabla operativa; Norte carta de siniestro (puedes cambiarlo).
          </p>

          @if (plantillaLoading()) {
            <app-skeleton variant="costos-pdf" class="mt-6 block" />
          } @else if (plantillaForm) {
            <form class="mt-6 space-y-4" (ngSubmit)="savePlantilla()">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium">Razón social</span>
                  <input class="field" [(ngModel)]="plantillaForm.razonSocial" name="razon" required />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">NIT</span>
                  <input class="field" [(ngModel)]="plantillaForm.nit" name="nit" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Ciudad</span>
                  <input class="field" [(ngModel)]="plantillaForm.ciudad" name="ciudad" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Teléfono</span>
                  <input class="field" [(ngModel)]="plantillaForm.telefono" name="tel" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Email</span>
                  <input class="field" [(ngModel)]="plantillaForm.email" name="email" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Color acento</span>
                  <input class="field" [(ngModel)]="plantillaForm.colorAcento" name="color" placeholder="#0f766e" />
                </label>
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium">Tipo de plantilla</span>
                  <select class="field" [(ngModel)]="plantillaForm.tipoPlantilla" name="tipo">
                    <option value="tabla_operativa">Tabla operativa (Full-style)</option>
                    <option value="carta_siniestro">Carta de siniestro (Norte-style)</option>
                  </select>
                </label>
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium">Texto header</span>
                  <input class="field" [(ngModel)]="plantillaForm.textoHeader" name="header" />
                </label>
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium">Texto footer</span>
                  <textarea class="field min-h-[72px]" [(ngModel)]="plantillaForm.textoFooter" name="footer"></textarea>
                </label>
              </div>
              <div class="flex justify-end">
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner"></span>
                    Guardando…
                  } @else {
                    <svg lucideSave [size]="16"></svg>
                    Guardar plantilla
                  }
                </button>
              </div>
            </form>
          }
        </section>
      } @else if (loading()) {
        <app-skeleton variant="costos-tarifas" />
      } @else {
        <!-- Category chips -->
        <div class="mt-6 flex flex-wrap gap-2">
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
                    class="btn-ghost !px-2.5 text-sm"
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
                    <thead class="bg-surface-muted/50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th class="px-4 py-2.5 font-semibold">Ítem</th>
                        <th class="px-4 py-2.5 font-semibold">Unidad</th>
                        <th class="px-4 py-2.5 font-semibold">Costo interno</th>
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
                            {{ item.costoInterno | number: '1.0-0' }}
                          </td>
                          <td class="px-4 py-3 text-brand-soft">
                            {{ item.precioSugerido | number: '1.0-0' }}
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
              No hay categorías. Crea la primera (Hogar, Apartamento, etc.).
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
                <span class="mb-1 block text-sm font-medium">Nombre</span>
                <input
                  class="field"
                  [(ngModel)]="catForm.nombre"
                  name="catNombre"
                  required
                  placeholder="Ej. Hogar, Apartamento…"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Descripción</span>
                <input
                  class="field"
                  [(ngModel)]="catForm.descripcion"
                  name="catDesc"
                  placeholder="Opcional"
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
                <span class="mb-1 block text-sm font-medium">Categoría</span>
                <select class="field" [(ngModel)]="itemForm.categoriaId" name="itemCat" required>
                  @for (c of categorias(); track c.id) {
                    <option [value]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nombre</span>
                <input
                  class="field"
                  [(ngModel)]="itemForm.nombre"
                  name="itemNombre"
                  required
                  placeholder='Ej. Tubería de 1/4", Cambio de sifón…'
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Descripción</span>
                <input
                  class="field"
                  [(ngModel)]="itemForm.descripcion"
                  name="itemDesc"
                  placeholder="Opcional"
                />
              </label>
              <div class="grid gap-4 sm:grid-cols-3">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Costo interno</span>
                  <input
                    class="field"
                    type="number"
                    min="0"
                    [(ngModel)]="itemForm.costoInterno"
                    name="itemCosto"
                    required
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Precio sugerido</span>
                  <input
                    class="field"
                    type="number"
                    min="0"
                    [(ngModel)]="itemForm.precioSugerido"
                    name="itemPrecio"
                    required
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Unidad</span>
                  <select class="field" [(ngModel)]="itemForm.unidad" name="itemUnidad">
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
  private readonly route = inject(ActivatedRoute);

  readonly returnTo = signal<{
    path: string;
    queryParams: Record<string, string>;
    label: string;
  } | null>(null);

  readonly tab = signal<TabId>('tarifas');
  readonly loading = signal(true);
  readonly plantillaLoading = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly categorias = signal<CategoriaConItems[]>([]);
  readonly filtroCat = signal<string | null>(null);

  readonly catModal = signal(false);
  readonly itemModal = signal(false);
  readonly editingCatId = signal<string | null>(null);
  readonly editingItemId = signal<string | null>(null);

  plantillaForm: PlantillaPdfCobro | null = null;

  catForm: CatForm = { nombre: '', descripcion: '' };
  itemForm: ItemForm = {
    categoriaId: '',
    nombre: '',
    descripcion: '',
    costoInterno: null,
    precioSugerido: null,
    unidad: 'und',
    activo: true,
  };

  readonly categoriasVisibles = computed(() => {
    const id = this.filtroCat();
    const all = this.categorias();
    return id ? all.filter((c) => c.id === id) : all;
  });

  readonly totalItems = computed(() =>
    this.categorias().reduce((n, c) => n + c.items.length, 0),
  );

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
    if (!this.plantillaForm) this.loadPlantilla();
  }

  loadPlantilla(): void {
    this.plantillaLoading.set(true);
    this.costos.getPlantillaPdf().subscribe({
      next: (p) => {
        this.plantillaForm = { ...p };
        this.plantillaLoading.set(false);
      },
      error: (err) => {
        this.plantillaLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar la plantilla PDF');
      },
    });
  }

  savePlantilla(): void {
    if (!this.plantillaForm) return;
    this.saving.set(true);
    this.error.set(null);
    const {
      razonSocial,
      nit,
      ciudad,
      telefono,
      email,
      colorAcento,
      textoHeader,
      textoFooter,
      tipoPlantilla,
    } = this.plantillaForm;
    this.costos
      .updatePlantillaPdf({
        razonSocial,
        nit,
        ciudad,
        telefono,
        email,
        colorAcento,
        textoHeader,
        textoFooter,
        tipoPlantilla,
      })
      .subscribe({
        next: (p) => {
          this.plantillaForm = { ...p };
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo guardar la plantilla');
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
    if (!this.catForm.nombre.trim()) return;
    this.saving.set(true);
    this.error.set(null);
    const payload = {
      nombre: this.catForm.nombre.trim(),
      descripcion: this.catForm.descripcion.trim(),
    };
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
    const msg =
      cat.items.length > 0
        ? `¿Eliminar "${cat.nombre}" y sus ${cat.items.length} ítems?`
        : `¿Eliminar la categoría "${cat.nombre}"?`;
    if (!confirm(msg)) return;

    this.deletingId.set(cat.id);
    this.costos.deleteCategoria(cat.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.filtroCat() === cat.id) this.filtroCat.set(null);
        this.reload();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.error.set(err?.error?.message ?? 'No se pudo eliminar la categoría');
      },
    });
  }

  openItemCreate(categoriaId: string): void {
    this.editingItemId.set(null);
    this.itemForm = {
      categoriaId,
      nombre: '',
      descripcion: '',
      costoInterno: null,
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
      costoInterno: item.costoInterno,
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
    if (!this.itemForm.nombre.trim() || !this.itemForm.categoriaId) return;
    if (this.itemForm.costoInterno == null || this.itemForm.precioSugerido == null) return;

    this.saving.set(true);
    this.error.set(null);
    const payload = {
      categoriaId: this.itemForm.categoriaId,
      nombre: this.itemForm.nombre.trim(),
      descripcion: this.itemForm.descripcion.trim(),
      costoInterno: Number(this.itemForm.costoInterno),
      precioSugerido: Number(this.itemForm.precioSugerido),
      unidad: this.itemForm.unidad,
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
    if (!confirm(`¿Eliminar el ítem "${item.nombre}"?`)) return;
    this.deletingId.set(item.id);
    this.costos.deleteItem(item.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.reload();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.error.set(err?.error?.message ?? 'No se pudo eliminar el ítem');
      },
    });
  }
}
