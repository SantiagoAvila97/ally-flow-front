import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideExternalLink, LucidePlus, LucideX } from '@lucide/angular';
import { Subscription, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import type { Aseguradora, CiudadCatalogo } from '../../core/models/catalogo.model';
import { CasosService } from '../../core/services/casos.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { GeoService, type GeoResult } from '../../core/services/geo.service';
import { suggestDireccionColombia } from '../../shared/direccion-suggest';
import { returnLabel, safeReturnTo } from '../../shared/nav-return';
import { SkeletonComponent } from '../../shared/skeleton.component';

@Component({
  selector: 'app-caso-nuevo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucidePlus,
    LucideExternalLink,
    LucideX,
    SkeletonComponent,
  ],
  template: `
    <div>
      <main class="mx-auto max-w-3xl px-6 py-8">
        <div class="mb-6 flex items-center justify-between gap-4">
          <a [routerLink]="backNav().path" [queryParams]="backNav().queryParams" class="btn-back">
            <svg lucideArrowLeft [size]="16"></svg>
            {{ backNav().label }}
          </a>
        </div>

        <h1 class="text-3xl font-semibold text-brand-ink">Crear nuevo caso</h1>
        <p class="mt-1 text-brand-soft/80">
          Tras la llamada, registra la ficha. Quedará en <strong>Por asignar</strong>.
        </p>

        @if (catalogosLoading()) {
          <div class="mt-8 space-y-4" aria-busy="true">
            <div class="skeleton h-10 w-full"></div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="skeleton h-10"></div>
              <div class="skeleton h-10"></div>
            </div>
            <div class="skeleton h-10 w-full"></div>
          </div>
        } @else {
          <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Título *</span>
              <input class="field" formControlName="titulo" placeholder="Inspección vehículo — colisión" />
            </label>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nº ID cliente *</span>
                <input class="field" formControlName="numeroAseguradora" placeholder="AUTO-88421" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Cliente *</span>
                <select class="field" formControlName="aseguradora">
                  <option value="" disabled>Selecciona cliente…</option>
                  @for (a of aseguradoras(); track a.id) {
                    <option [value]="a.nombre">{{ a.nombre }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Titular / contacto *</span>
                <input
                  class="field"
                  formControlName="titularNombre"
                  placeholder="Ej. Carlos Méndez / Logística Andina Ltda."
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Celular *</span>
                <input class="field" formControlName="titularTelefono" placeholder="+57 300 123 4567" />
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Ciudad *</span>
                <select class="field" formControlName="ciudad">
                  <option value="" disabled>Selecciona ciudad…</option>
                  @for (c of ciudades(); track c.id) {
                    <option [value]="c.nombre">{{ c.nombre }}</option>
                  }
                </select>
                <span class="mt-1 block text-xs text-slate-500">Bogotá y municipios aledaños</span>
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Categoría *</span>
                <select class="field" formControlName="categoriaServicio" [disabled]="!categorias().length">
                  <option value="" disabled>
                    {{ categorias().length ? 'Selecciona…' : 'Sin categorías configuradas' }}
                  </option>
                  @for (c of categorias(); track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
                @if (!catalogosLoading() && !categorias().length) {
                  <span class="mt-1 block text-xs text-amber-700">
                    Configúralas en
                    <a routerLink="/admin" class="font-medium underline">Admin → Tarifas</a>
                    (Nueva categoría). Luego vuelve aquí.
                  </span>
                }
              </label>
            </div>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Dirección del servicio *</span>
              <input
                class="field"
                formControlName="direccion"
                placeholder="Ej. Calle 100 #19-50 · Trans 124 #130 F-46"
              />
              <div class="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                <p class="font-semibold text-slate-700">Formato (Colombia)</p>
                <p class="mt-1">
                  Escribe la dirección completa: <strong>Vía</strong> + número + <strong>#</strong> + placa con guion.
                </p>
                <ul class="mt-1 list-disc pl-4 space-y-0.5">
                  <li><code>Calle 100 #19-50</code></li>
                  <li><code>Cra 15 #85-20</code></li>
                  <li><code>Trans 124 #130 F-46</code> (usa guion en la placa)</li>
                </ul>
                <p class="mt-1 text-slate-500">
                  Si falta el guion en la placa, el mapa suele fallar; te sugeriremos la corrección.
                </p>
              </div>
            </label>

            <div #mapSection class="scroll-mt-24">
              @if (geoLoading()) {
                <app-skeleton variant="map-preview" />
              } @else if (geoError()) {
                <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ geoError() }}</p>
              } @else if (geo()) {
                <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                    <p class="text-xs text-brand-soft line-clamp-2">{{ geo()!.displayName }}</p>
                    <a
                      class="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      [href]="geo()!.mapLink"
                      target="_blank"
                      rel="noopener"
                    >
                      <svg lucideExternalLink [size]="12"></svg>
                      Abrir en Google Maps
                    </a>
                  </div>
                  @if (mapSafeUrl(); as mapUrl) {
                    <iframe
                      class="h-56 w-full border-0"
                      [src]="mapUrl"
                      title="Vista previa Google Maps"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                      allowfullscreen
                    ></iframe>
                  }
                </div>
              }
            </div>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Observaciones *</span>
              <textarea
                class="field min-h-[100px]"
                formControlName="observaciones"
                placeholder="Referencias de acceso, citófono, etc."
              ></textarea>
            </label>

            @if (error()) {
              <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
            }

            <button type="submit" class="btn-estado" [disabled]="loading() || form.invalid || !geo()">
              @if (loading()) {
                <span class="spinner"></span>
                Creando…
              } @else {
                <svg lucidePlus [size]="16"></svg>
                Crear caso
              }
            </button>
            @if (!geo() && form.controls.direccion.value && form.controls.ciudad.value) {
              <p class="text-xs text-amber-700">Debes validar la dirección en el mapa antes de crear el caso.</p>
            }
          </form>
        }
      </main>

      @if (direccionSuggest(); as sug) {
        <div
          class="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dir-suggest-title"
          (click)="ignorarSugerencia()"
        >
          <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-soft" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 id="dir-suggest-title" class="text-lg font-semibold text-brand-ink">
                  ¿Corregir la dirección?
                </h2>
                <p class="mt-1 text-sm text-brand-soft">
                  Sin guion en la placa, Google Maps suele perder el punto. Te sugerimos este formato:
                </p>
              </div>
              <button type="button" class="icon-btn" (click)="ignorarSugerencia()" aria-label="Cerrar">
                <svg lucideX [size]="18"></svg>
              </button>
            </div>

            <div class="mt-4 space-y-2 text-sm">
              <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Escribiste</p>
                <p class="mt-0.5 font-medium text-brand-ink">{{ sug.original }}</p>
              </div>
              <div class="rounded-md border border-accent/40 bg-accent-soft/50 px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-accent">Sugerencia</p>
                <p class="mt-0.5 font-semibold text-brand-ink">{{ sug.suggested }}</p>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" class="btn-ghost border border-slate-200" (click)="ignorarSugerencia()">
                Dejar como está
              </button>
              <button type="button" class="btn-estado" (click)="aplicarSugerencia()">Usar sugerencia</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
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
      .btn-back {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        background: white;
        padding: 0.5rem 0.9rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--brand-ink);
        transition: background 0.15s, border-color 0.15s;
      }
      .btn-back:hover {
        background: var(--surface-muted);
        border-color: var(--action);
        color: var(--action);
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        color: var(--brand-soft);
      }
      .icon-btn:hover {
        background: var(--surface-muted);
      }
    `,
  ],
})
export class CasoNuevoComponent implements OnInit, OnDestroy {
  private readonly casos = inject(CasosService);
  private readonly catalogosApi = inject(CatalogosService);
  private readonly geoService = inject(GeoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly aseguradoras = signal<Aseguradora[]>([]);
  readonly ciudades = signal<CiudadCatalogo[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly catalogosLoading = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly geoLoading = signal(false);
  readonly geoError = signal<string | null>(null);
  readonly geo = signal<GeoResult | null>(null);
  readonly mapSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly direccionSuggest = signal<{ original: string; suggested: string } | null>(null);
  readonly backNav = signal<{
    path: string;
    queryParams: Record<string, string>;
    label: string;
  }>({ path: '/home', queryParams: {}, label: 'Volver a bandeja' });

  private geoSub?: Subscription;
  private suggestSub?: Subscription;
  private scrollSub?: Subscription;
  private ignoredSuggestions = new Set<string>();
  private readonly mapSection = viewChild<ElementRef<HTMLElement>>('mapSection');
  private didScrollForTyping = false;

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    numeroAseguradora: ['', Validators.required],
    aseguradora: ['', Validators.required],
    titularNombre: ['', Validators.required],
    titularTelefono: ['', Validators.required],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    ciudad: ['', Validators.required],
    categoriaServicio: ['', Validators.required],
    observaciones: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    const returnRaw = safeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'));
    if (returnRaw) {
      const [path, qs] = returnRaw.split('?');
      const queryParams: Record<string, string> = {};
      if (qs) {
        new URLSearchParams(qs).forEach((v, k) => {
          queryParams[k] = v;
        });
      }
      this.backNav.set({
        path: path || '/home',
        queryParams,
        label: returnLabel(returnRaw),
      });
    }

    this.catalogosApi.getAll().subscribe({
      next: (cats) => {
        this.aseguradoras.set(cats.aseguradoras);
        this.ciudades.set(cats.ciudades);
        this.categorias.set(cats.categoriasServicio);
        const bogota = cats.ciudades.find((c) => c.nombre === 'Bogotá');
        if (bogota && !this.form.controls.ciudad.value) {
          this.form.controls.ciudad.setValue(bogota.nombre);
        }
        this.catalogosLoading.set(false);
      },
      error: () => {
        this.catalogosLoading.set(false);
        this.error.set('No se pudieron cargar clientes, ciudades y categorías');
      },
    });

    this.suggestSub = this.form.controls.direccion.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        const original = (value ?? '').trim();
        if (original.length < 5) {
          this.direccionSuggest.set(null);
          return;
        }
        const suggested = suggestDireccionColombia(original);
        if (
          suggested &&
          suggested !== original &&
          !this.ignoredSuggestions.has(original.toLowerCase())
        ) {
          this.direccionSuggest.set({ original, suggested });
        } else {
          this.direccionSuggest.set(null);
        }
      });

    this.scrollSub = this.form.controls.direccion.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value) => {
        if ((value ?? '').trim().length >= 3 && !this.didScrollForTyping) {
          this.didScrollForTyping = true;
          this.scrollMapIntoView();
        }
        if (!(value ?? '').trim()) {
          this.didScrollForTyping = false;
        }
      });

    this.geoSub = this.form.valueChanges
      .pipe(
        debounceTime(700),
        distinctUntilChanged(
          (a, b) => a?.direccion === b?.direccion && a?.ciudad === b?.ciudad,
        ),
        filter((v) => !!v.ciudad && (v.direccion?.trim().length ?? 0) >= 5),
        filter(() => !this.direccionSuggest()),
        switchMap((v) => {
          this.geoLoading.set(true);
          this.geoError.set(null);
          this.geo.set(null);
          this.mapSafeUrl.set(null);
          return this.geoService.search(v.direccion!.trim(), v.ciudad!).pipe(
            catchError((err) => {
              this.geoLoading.set(false);
              this.geo.set(null);
              this.mapSafeUrl.set(null);
              this.geoError.set(err?.error?.message ?? 'No se pudo validar la dirección');
              return of(null);
            }),
          );
        }),
        filter((result): result is GeoResult => result !== null),
      )
      .subscribe({
        next: (result) => {
          this.geoLoading.set(false);
          this.geoError.set(null);
          this.geo.set(result);
          this.mapSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(result.mapEmbedUrl));
          this.scrollMapIntoView();
        },
      });
  }

  ngOnDestroy(): void {
    this.geoSub?.unsubscribe();
    this.suggestSub?.unsubscribe();
    this.scrollSub?.unsubscribe();
  }

  private scrollMapIntoView(): void {
    requestAnimationFrame(() => {
      this.mapSection()?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  aplicarSugerencia(): void {
    const sug = this.direccionSuggest();
    if (!sug) return;
    this.direccionSuggest.set(null);
    this.form.controls.direccion.setValue(sug.suggested);
  }

  ignorarSugerencia(): void {
    const sug = this.direccionSuggest();
    if (sug) {
      this.ignoredSuggestions.add(sug.original.toLowerCase());
    }
    this.direccionSuggest.set(null);
    const dir = this.form.controls.direccion.value;
    this.form.controls.direccion.setValue(dir, { emitEvent: true });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.geo()) {
      this.error.set('Completa el formulario y valida la dirección en el mapa');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const geo = this.geo()!;
    const raw = this.form.getRawValue();
    this.casos
      .create({
        ...raw,
        lat: geo.lat,
        lon: geo.lon,
        direccionNormalizada: geo.displayName,
      })
      .subscribe({
        next: (caso) => void this.router.navigate(['/casos', caso.id]),
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo crear el caso');
        },
        complete: () => this.loading.set(false),
      });
  }
}
