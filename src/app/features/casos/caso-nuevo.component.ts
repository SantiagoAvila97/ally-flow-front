import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideExternalLink, LucidePlus } from '@lucide/angular';
import { Subscription, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { CasosService } from '../../core/services/casos.service';
import { GeoService, type GeoResult } from '../../core/services/geo.service';
import { CIUDADES_BOGOTA_AREA } from '../../shared/ciudades-bogota';
import { returnLabel, safeReturnTo } from '../../shared/nav-return';
import { SkeletonComponent } from '../../shared/skeleton.component';

@Component({
  selector: 'app-caso-nuevo',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideArrowLeft, LucidePlus, LucideExternalLink, SkeletonComponent],
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
          Tras la llamada, registra la ficha. Quedará en <strong>Pendiente de asignación</strong>.
        </p>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Título</span>
            <input class="field" formControlName="titulo" placeholder="Inspección vehículo — colisión" />
          </label>

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Nº ID aseguradora</span>
              <input class="field" formControlName="numeroAseguradora" placeholder="AUTO-88421" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Aseguradora</span>
              <input class="field" formControlName="aseguradora" placeholder="Sura Seguros" />
            </label>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Titular / contacto</span>
              <input
                class="field"
                formControlName="titularNombre"
                placeholder="Ej. Carlos Méndez / Logística Andina Ltda."
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Teléfono</span>
              <input class="field" formControlName="titularTelefono" placeholder="+57 300 123 4567" />
            </label>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Ciudad</span>
              <select class="field" formControlName="ciudad">
                <option value="" disabled>Selecciona ciudad…</option>
                @for (c of ciudades; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
              <span class="mt-1 block text-xs text-slate-500">Bogotá y municipios aledaños</span>
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Categoría de servicio</span>
              <select class="field" formControlName="categoriaServicio">
                <option value="" disabled>Selecciona…</option>
                @for (c of categorias(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </label>
          </div>

          <label class="block">
            <span class="mb-1 block text-sm font-medium">Dirección del servicio</span>
            <input
              class="field"
              formControlName="direccion"
              placeholder="Ej. Calle 100 #19-50"
            />
            <div class="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              <p class="font-semibold text-slate-700">Formato (Colombia)</p>
              <p class="mt-1">
                Escribe la dirección completa: <strong>Vía</strong> + número + <strong>#</strong> + placa.
              </p>
              <ul class="mt-1 list-disc pl-4 space-y-0.5">
                <li><code>Calle 100 #19-50</code></li>
                <li><code>Cra 15 #85-20</code></li>
                <li><code>Av Boyacá #80-20</code></li>
                <li>También: Transversal / Trans / Tv + número + # placa</li>
              </ul>
              <p class="mt-1 text-slate-500">
                La vista previa usa Google Maps con tu dirección tal cual la escribes (no se recorta).
              </p>
            </div>
          </label>

          @if (geoLoading()) {
            <app-skeleton variant="map-preview" />
          } @else if (geoError()) {
            <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ geoError() }}</p>
          } @else if (geo()) {
            <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <p class="text-xs text-brand-soft line-clamp-2">{{ geo()!.displayName }}</p>
                <a class="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline" [href]="geo()!.mapLink" target="_blank" rel="noopener">
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

          <label class="block">
            <span class="mb-1 block text-sm font-medium">Observaciones</span>
            <textarea class="field min-h-[100px]" formControlName="observaciones" placeholder="Referencias de acceso, citófono, etc."></textarea>
          </label>

          @if (error()) {
            <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
          }

          <button
            type="submit"
            class="btn-estado"
            [disabled]="loading() || form.invalid || !geo()"
          >
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
      </main>
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
    `,
  ],
})
export class CasoNuevoComponent implements OnInit, OnDestroy {
  private readonly casos = inject(CasosService);
  private readonly geoService = inject(GeoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly ciudades = CIUDADES_BOGOTA_AREA;
  readonly categorias = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly geoLoading = signal(false);
  readonly geoError = signal<string | null>(null);
  readonly geo = signal<GeoResult | null>(null);
  readonly mapSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly backNav = signal<{
    path: string;
    queryParams: Record<string, string>;
    label: string;
  }>({ path: '/home', queryParams: {}, label: 'Volver a bandeja' });

  private geoSub?: Subscription;

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    numeroAseguradora: ['', Validators.required],
    aseguradora: ['', Validators.required],
    titularNombre: ['', Validators.required],
    titularTelefono: ['', Validators.required],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    ciudad: ['Bogotá', Validators.required],
    categoriaServicio: ['', Validators.required],
    observaciones: [''],
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

    this.casos.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats),
      error: () => this.categorias.set(['Hogar', 'Apartamento', 'Oficina', 'Local comercial', 'Glass']),
    });

    this.geoSub = this.form.valueChanges
      .pipe(
        debounceTime(700),
        distinctUntilChanged(
          (a, b) => a?.direccion === b?.direccion && a?.ciudad === b?.ciudad,
        ),
        filter((v) => !!v.ciudad && (v.direccion?.trim().length ?? 0) >= 5),
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
        },
      });
  }

  ngOnDestroy(): void {
    this.geoSub?.unsubscribe();
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
