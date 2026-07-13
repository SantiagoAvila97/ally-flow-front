import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  EmpresasService,
  type CreateEmpresaResult,
  type EmpresaListItem,
} from '../../core/services/empresas.service';
import {
  UsuariosService,
  type ManagedUser,
} from '../../core/services/usuarios.service';
import {
  generateStrongPassword,
  passwordStrength,
  passwordStrengthLabel,
  type PasswordStrength,
} from '../../core/utils/password';
import { readSquareLogoFile } from '../../core/utils/logo-file';

@Component({
  selector: 'app-suite',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-4xl px-6 py-10">
      <header class="mb-10">
        <p class="text-xs font-semibold uppercase tracking-wider text-brand/70">Plataforma</p>
        <h1 class="mt-1 text-3xl font-semibold text-brand-ink">Suite</h1>
        <p class="mt-2 max-w-2xl text-sm text-brand-soft">
          SUPER ADMIN: crea empresas (cada una nace con un OWNER) y consulta el equipo en solo
          lectura. Crear o editar usuarios lo hacen OWNER y Administradores.
        </p>
      </header>

      <section class="mb-12 border-b border-slate-200 pb-10">
        <h2 class="mb-4 text-lg font-semibold text-brand-ink">Nueva empresa</h2>
        <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Nombre empresa *</span>
            <input class="field" formControlName="nombre" placeholder="Santiago Avila S.A.S" />
            @if (slugPreview()) {
              <p class="mt-1 text-[11px] text-slate-500">
                Identificador interno:
                <span class="font-mono text-brand-soft">{{ slugPreview() }}</span>
              </p>
            }
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">NIT *</span>
            <input class="field" formControlName="nit" placeholder="900123456-1" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">OWNER — nombre *</span>
            <input class="field" formControlName="adminNombre" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">OWNER — email *</span>
            <input class="field" type="email" formControlName="adminEmail" />
          </label>
          <div class="sm:col-span-2">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-brand-soft">OWNER — contraseña *</span>
              <button
                type="button"
                class="btn-ghost-sm"
                (click)="generatePassword()"
              >
                Generar aleatoria
              </button>
            </div>
            <input
              class="field font-mono"
              type="text"
              formControlName="adminPassword"
              autocomplete="new-password"
              (input)="onPasswordInput()"
            />
            @if (form.controls.adminPassword.value) {
              <p class="mt-1.5 text-xs font-semibold" [class]="'str-' + pwdStrength()">
                {{ strengthLabel() }}
              </p>
            }
          </div>

          <div class="sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Logo empresa * (1:1)</span>
            <div class="flex flex-wrap items-start gap-4">
              <label
                class="group relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-brand hover:bg-white"
                [class.border-solid]="!!logoPreview()"
                [class.border-slate-200]="!!logoPreview()"
                title="Subir logo cuadrado 1:1"
              >
                @if (logoPreview()) {
                  <img [src]="logoPreview()!" alt="Vista previa" class="h-full w-full object-cover" />
                  <span
                    class="absolute inset-0 flex items-center justify-center bg-black/40 text-2xl font-light text-white opacity-0 transition group-hover:opacity-100"
                    >+</span
                  >
                } @else {
                  <span class="text-2xl font-light leading-none text-slate-400">+</span>
                  <span class="mt-1 text-[10px] font-medium text-slate-400">1:1</span>
                }
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="sr-only"
                  (change)="onLogoFile($event)"
                />
              </label>
              <p class="max-w-xs pt-1 text-[11px] leading-relaxed text-slate-500">
                Obligatoria al crear. PNG, JPG o WEBP cuadrado. Máx. 800KB.
                DEMO / Full pueden quedar sin logo y el OWNER lo agrega después.
              </p>
            </div>
          </div>

          @if (error()) {
            <p class="sm:col-span-2 text-sm text-red-600">{{ error() }}</p>
          }

          <div class="sm:col-span-2">
            <button
              type="submit"
              class="btn-primary disabled:opacity-50"
              [disabled]="form.invalid || !logoDataUrl() || saving()"
            >
              {{ saving() ? 'Creando…' : 'Crear empresa' }}
            </button>
          </div>
        </form>
      </section>

      <section class="mb-10">
        <h2 class="mb-4 text-lg font-semibold text-brand-ink">Tenants</h2>
        @if (loading()) {
          <p class="text-sm text-brand-soft">Cargando…</p>
        } @else if (!empresas().length) {
          <p class="text-sm text-brand-soft">Aún no hay empresas.</p>
        } @else {
          <div class="overflow-x-auto border border-slate-200">
            <table class="w-full min-w-[720px] text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wide text-brand-soft">
                <tr>
                  <th class="px-4 py-3 font-semibold">Empresa</th>
                  <th class="px-4 py-3 font-semibold">NIT</th>
                  <th class="px-4 py-3 font-semibold">OWNER</th>
                  <th class="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (e of empresas(); track e.id) {
                  <tr [class.bg-accent-soft]="selectedEmpresaId() === e.id">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white"
                          [class.border-dashed]="!e.logoDataUrl"
                          [class.border-2]="!e.logoDataUrl"
                          [class.bg-slate-50]="!e.logoDataUrl"
                        >
                          @if (e.logoDataUrl) {
                            <img [src]="e.logoDataUrl" alt="" class="h-full w-full object-cover" />
                          } @else {
                            <span class="text-lg font-light leading-none text-slate-400">+</span>
                          }
                        </div>
                        <span class="font-medium text-brand-ink">{{ e.nombre }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-brand-soft">{{ e.nit || '—' }}</td>
                    <td class="px-4 py-3">
                      @if (e.owner; as ow) {
                        <div class="leading-tight">
                          <p class="font-medium text-brand-ink">{{ ow.nombre }}</p>
                          <p class="text-xs text-brand-soft">{{ ow.email }}</p>
                        </div>
                      } @else {
                        <span class="text-xs text-slate-400">Sin OWNER</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          class="btn-primary !px-3 !py-1.5 !text-xs"
                          [class.opacity-90]="selectedEmpresaId() === e.id"
                          (click)="selectEmpresa(e)"
                        >
                          {{ selectedEmpresaId() === e.id ? 'Usuarios ✓' : 'Ver usuarios' }}
                        </button>
                        <button
                          type="button"
                          class="btn-danger"
                          [disabled]="!e.canDelete || deletingId() === e.id"
                          (click)="deleteEmpresa(e)"
                        >
                          {{ deletingId() === e.id ? 'Eliminando…' : 'Eliminar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-[11px] text-slate-500">
            @if (canDeleteAny()) {
              En QA/local puedes eliminar tenants. En PROD no.
            } @else {
              Eliminar tenants no disponible en PROD.
            }
          </p>
        }
      </section>

      @if (selectedEmpresaId(); as eid) {
        <section class="rounded-lg border border-slate-200 bg-slate-50/80 p-5">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-brand-ink">
                Usuarios — {{ selectedEmpresaNombre() }}
              </h2>
              <p class="mt-1 text-sm text-brand-soft">
                Solo lectura. Crear o editar usuarios lo hace el OWNER / Administrador.
              </p>
            </div>
            <button type="button" class="btn-ghost-sm" (click)="clearSelection()">
              Cerrar
            </button>
          </div>
          @if (usersLoading()) {
            <p class="text-sm text-brand-soft">Cargando usuarios…</p>
          } @else if (!tenantUsers().length) {
            <p class="text-sm text-brand-soft">Sin usuarios en esta empresa.</p>
          } @else {
            <div class="overflow-x-auto rounded-md border border-slate-200 bg-white">
              <table class="w-full min-w-[560px] text-left text-sm">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th class="px-4 py-3 font-semibold">Nombre</th>
                    <th class="px-4 py-3 font-semibold">Email</th>
                    <th class="px-4 py-3 font-semibold">Rol</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (u of tenantUsers(); track u.id) {
                    <tr>
                      <td class="px-4 py-3 font-medium text-brand-ink">{{ u.nombre }}</td>
                      <td class="px-4 py-3 text-brand-soft">{{ u.email }}</td>
                      <td class="px-4 py-3">
                        <span class="role-pill" [attr.data-role]="u.esOwner ? 'owner' : u.role">
                          {{ roleLabel(u) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="status-pill" [attr.data-on]="u.activo">
                          {{ u.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </div>

    @if (shareSummary(); as share) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="closeShare()"
      >
        <div
          class="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
          (click)="$event.stopPropagation()"
          role="dialog"
        >
          <h2 class="text-lg font-semibold text-brand-ink">Empresa creada — datos para compartir</h2>
          <p class="mt-1 text-sm text-brand-soft">Copia y envía al OWNER (una sola vez).</p>
          <pre
            class="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs"
            >{{ share }}</pre
          >
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="btn-primary"
              (click)="copyShare()"
            >
              {{ copied() ? '¡Copiado!' : 'Copiar al portapapeles' }}
            </button>
            <button
              type="button"
              class="btn-ghost border border-slate-200"
              (click)="closeShare()"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
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
    .str-baja {
      color: #b91c1c;
    }
    .str-media {
      color: #b45309;
    }
    .str-alta {
      color: #047857;
    }
    .btn-danger {
      display: inline-flex;
      align-items: center;
      border-radius: 0.375rem;
      border: 1px solid #fecaca;
      background: #fef2f2;
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #b91c1c;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
      border-color: #b91c1c;
      color: #fff;
    }
    .btn-danger:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
    .btn-ghost-sm {
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
      background: #fff;
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .btn-ghost-sm:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .role-pill {
      display: inline-flex;
      border-radius: 0.25rem;
      padding: 0.15rem 0.45rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #475569;
    }
    .role-pill[data-role='owner'] {
      background: #ecfdf5;
      color: #047857;
    }
    .role-pill[data-role='ADMIN'] {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .status-pill {
      display: inline-flex;
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .status-pill[data-on='true'] {
      background: #ecfdf5;
      color: #047857;
    }
    .status-pill[data-on='false'] {
      background: #fef2f2;
      color: #b91c1c;
    }
  `,
})
export class SuiteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empresasApi = inject(EmpresasService);
  private readonly usuariosApi = inject(UsuariosService);

  readonly empresas = signal<EmpresaListItem[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly shareSummary = signal<string | null>(null);
  readonly copied = signal(false);
  readonly slugPreview = signal('');
  readonly pwdStrength = signal<PasswordStrength>('baja');
  readonly selectedEmpresaId = signal<string | null>(null);
  readonly selectedEmpresaNombre = signal('');
  readonly tenantUsers = signal<ManagedUser[]>([]);
  readonly usersLoading = signal(false);
  readonly logoDataUrl = signal<string | null>(null);
  readonly logoPreview = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    nit: ['', [Validators.required, Validators.minLength(5)]],
    adminNombre: ['', [Validators.required, Validators.minLength(2)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.form.controls.nombre.valueChanges.subscribe((n) => {
      this.slugPreview.set(this.toSlug(n ?? ''));
    });
    this.reload();
    this.generatePassword();
  }

  toSlug(raw: string): string {
    const n = raw.trim();
    if (n.length < 2) return '';
    return n
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  strengthLabel(): string {
    return passwordStrengthLabel(this.pwdStrength());
  }

  onPasswordInput(): void {
    this.pwdStrength.set(passwordStrength(this.form.controls.adminPassword.value ?? ''));
  }

  generatePassword(): void {
    const pw = generateStrongPassword(16);
    this.form.controls.adminPassword.setValue(pw);
    this.pwdStrength.set(passwordStrength(pw));
  }

  async onLogoFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.error.set(null);
    if (!file) {
      this.logoDataUrl.set(null);
      this.logoPreview.set(null);
      return;
    }
    try {
      const dataUrl = await readSquareLogoFile(file);
      this.logoDataUrl.set(dataUrl);
      this.logoPreview.set(dataUrl);
    } catch (e) {
      this.logoDataUrl.set(null);
      this.logoPreview.set(null);
      this.error.set(e instanceof Error ? e.message : 'Logo inválido');
      input.value = '';
    }
  }

  roleLabel(u: ManagedUser): string {
    if (u.esOwner) return 'OWNER';
    if (u.role === 'ADMIN') return 'Administrador';
    if (u.role === 'ASESOR') return 'Asesor';
    if (u.role === 'TECNICO') return 'Técnico';
    return u.role;
  }

  selectEmpresa(e: EmpresaListItem): void {
    this.selectedEmpresaId.set(e.id);
    this.selectedEmpresaNombre.set(e.nombre);
    this.usersLoading.set(true);
    this.tenantUsers.set([]);
    this.usuariosApi.list(e.id).subscribe({
      next: (rows) => {
        this.tenantUsers.set(rows);
        this.usersLoading.set(false);
      },
      error: (err) => {
        this.usersLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar usuarios');
      },
    });
  }

  clearSelection(): void {
    this.selectedEmpresaId.set(null);
    this.selectedEmpresaNombre.set('');
    this.tenantUsers.set([]);
  }

  canDeleteAny(): boolean {
    return this.empresas().some((x) => x.canDelete);
  }

  deleteEmpresa(e: EmpresaListItem): void {
    if (!e.canDelete) return;
    const seedHint = e.protegida
      ? '\n\nEste es un tenant semilla (DEMO / Full). Se borrarán todos sus datos.'
      : '';
    const ok = confirm(
      `¿Eliminar el tenant «${e.nombre}» y todos sus datos?${seedHint}\n\nEsta acción no se puede deshacer.`,
    );
    if (!ok) return;
    this.deletingId.set(e.id);
    this.error.set(null);
    this.empresasApi.delete(e.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.selectedEmpresaId() === e.id) {
          this.selectedEmpresaId.set(null);
          this.tenantUsers.set([]);
        }
        this.reload();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.error.set(err?.error?.message ?? 'No se pudo eliminar la empresa');
      },
    });
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
    const logo = this.logoDataUrl();
    if (this.form.invalid || !logo) {
      if (!logo) this.error.set('Debes cargar un logo cuadrado (1:1)');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.empresasApi
      .create({
        nombre: v.nombre.trim(),
        nit: v.nit.trim(),
        adminNombre: v.adminNombre.trim(),
        adminEmail: v.adminEmail.trim(),
        adminPassword: v.adminPassword,
        logoDataUrl: logo,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.shareSummary.set(this.buildShareText(res, v.adminPassword));
          this.copied.set(false);
          this.form.reset({
            nombre: '',
            nit: '',
            adminNombre: '',
            adminEmail: '',
            adminPassword: '',
          });
          this.logoDataUrl.set(null);
          this.logoPreview.set(null);
          this.generatePassword();
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo crear la empresa');
        },
      });
  }

  buildShareText(res: CreateEmpresaResult, password: string): string {
    const loginUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'https://app.allyflow…/login';
    const envHint = environment.appEnv === 'prod' ? 'PROD' : 'QA';
    return [
      `Ally Flow — acceso ${envHint}`,
      ``,
      `Empresa: ${res.empresa.nombre}`,
      `NIT: ${res.empresa.nit}`,
      ``,
      `OWNER: ${res.admin.nombre}`,
      `Email: ${res.admin.email}`,
      `Contraseña: ${password}`,
      ``,
      `Ingresa en: ${loginUrl}`,
      ``,
      `Cambia la contraseña en Perfil después del primer acceso.`,
    ].join('\n');
  }

  async copyShare(): Promise<void> {
    const text = this.shareSummary();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
    } catch {
      this.error.set('No se pudo copiar. Selecciona el texto manualmente.');
    }
  }

  closeShare(): void {
    this.shareSummary.set(null);
    this.copied.set(false);
  }
}
