import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresasService, type Empresa } from '../../core/services/empresas.service';

@Component({
  selector: 'app-suite',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-3xl px-6 py-10">
      <header class="mb-10">
        <p class="text-xs font-semibold uppercase tracking-wider text-brand/70">Plataforma</p>
        <h1 class="mt-1 text-3xl font-semibold text-brand-ink">Empresas (tenants)</h1>
        <p class="mt-2 max-w-xl text-sm text-brand-soft">
          Crea clientes nuevos. Cada empresa nace con un ADMIN propio; sin datos demo.
        </p>
      </header>

      <section class="mb-12 border-b border-slate-200 pb-10">
        <h2 class="mb-4 text-lg font-semibold text-brand-ink">Nueva empresa</h2>
        <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Nombre empresa</span>
            <input class="field" formControlName="nombre" placeholder="Nombre Cliente SAS" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Slug (opcional)</span>
            <input class="field" formControlName="slug" placeholder="nombre-cliente" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Admin — nombre</span>
            <input class="field" formControlName="adminNombre" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Admin — email</span>
            <input class="field" type="email" formControlName="adminEmail" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Admin — contraseña (≥8)</span>
            <input class="field" type="password" formControlName="adminPassword" autocomplete="new-password" />
          </label>

          @if (error()) {
            <p class="sm:col-span-2 text-sm text-red-600">{{ error() }}</p>
          }
          @if (ok()) {
            <p class="sm:col-span-2 text-sm text-teal-700">{{ ok() }}</p>
          }

          <div class="sm:col-span-2">
            <button
              type="submit"
              class="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              [disabled]="form.invalid || saving()"
            >
              {{ saving() ? 'Creando…' : 'Crear empresa' }}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 class="mb-4 text-lg font-semibold text-brand-ink">Tenants existentes</h2>
        @if (loading()) {
          <p class="text-sm text-brand-soft">Cargando…</p>
        } @else if (!empresas().length) {
          <p class="text-sm text-brand-soft">Aún no hay empresas. Crea la primera arriba.</p>
        } @else {
          <ul class="divide-y divide-slate-100 border border-slate-200">
            @for (e of empresas(); track e.id) {
              <li class="flex items-baseline justify-between gap-4 px-4 py-3">
                <span class="font-medium text-brand-ink">{{ e.nombre }}</span>
                <span class="font-mono text-xs text-brand-soft">{{ e.slug }}</span>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: `
    .field {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.55rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
    }
    .field:focus {
      border-color: #0f766e;
      box-shadow: 0 0 0 3px rgb(15 118 110 / 0.15);
    }
  `,
})
export class SuiteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empresasApi = inject(EmpresasService);

  readonly empresas = signal<Empresa[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
    adminNombre: ['', [Validators.required, Validators.minLength(2)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.empresasApi.list().subscribe({
      next: (rows) => {
        this.empresas.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar empresas');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.ok.set(null);
    const v = this.form.getRawValue();
    this.empresasApi
      .create({
        nombre: v.nombre.trim(),
        slug: v.slug.trim() || undefined,
        adminNombre: v.adminNombre.trim(),
        adminEmail: v.adminEmail.trim(),
        adminPassword: v.adminPassword,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.ok.set(
            `Creada «${res.empresa.nombre}». Admin: ${res.admin.email} (comparte la clave de forma segura).`,
          );
          this.form.reset({
            nombre: '',
            slug: '',
            adminNombre: '',
            adminEmail: '',
            adminPassword: '',
          });
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo crear la empresa');
        },
      });
  }
}
