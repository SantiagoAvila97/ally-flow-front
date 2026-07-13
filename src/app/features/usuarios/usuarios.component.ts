import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
  EmpresasService,
  type EmpresaListItem,
} from '../../core/services/empresas.service';
import {
  UsuariosService,
  type ManagedUser,
  type TenantManageRole,
} from '../../core/services/usuarios.service';
import {
  generateStrongPassword,
  passwordStrength,
  passwordStrengthLabel,
  type PasswordStrength,
} from '../../core/utils/password';

type PanelMode = 'closed' | 'create' | 'edit' | 'reset' | 'manage';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-3xl px-6 py-10">
      <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-brand/70">Equipo</p>
          <h1 class="mt-1 text-3xl font-semibold text-brand-ink">Usuarios</h1>
          <p class="mt-2 max-w-xl text-sm text-brand-soft">
            @if (isPlatformSuper()) {
              Crea y gestiona administradores por empresa.
            } @else if (isEmpresaOwner()) {
              Gestiona administradores, asesores y técnicos de tu empresa (tú eres OWNER).
            } @else {
              Gestiona asesores y técnicos de tu empresa.
            }
          </p>
        </div>
        @if (canCreate()) {
          <button
            type="button"
            class="btn-primary"
            (click)="openCreate()"
          >
            Nuevo usuario
          </button>
        }
      </header>

      <!-- Tú -->
      <section class="mb-8 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-soft">Tú</p>
        <p class="mt-1 text-xl font-semibold text-brand-ink">{{ meNombre() }}</p>
        <p class="mt-0.5 text-sm text-brand-soft">{{ meRoleLabel() }} · {{ meEmail() }}</p>
      </section>

      @if (isSuper()) {
        <label class="mb-6 block max-w-sm">
          <span class="mb-1 block text-xs font-medium text-brand-soft">Empresa *</span>
          <select class="field" [value]="empresaId()" (change)="onEmpresaChange($event)">
            <option value="">Selecciona empresa…</option>
            @for (e of empresas(); track e.id) {
              <option [value]="e.id">{{ e.nombre }}</option>
            }
          </select>
        </label>
      }

      @if (error()) {
        <p class="mb-4 text-sm text-red-600">{{ error() }}</p>
      }

      <section>
        <h2 class="mb-3 text-lg font-semibold text-brand-ink">
          @if (isSuper()) {
            Equipo de la empresa
          } @else {
            Equipo a tu cargo
          }
        </h2>

        @if (!empresaId() && isSuper()) {
          <p class="text-sm text-brand-soft">Selecciona una empresa para ver usuarios.</p>
        } @else if (loading()) {
          <p class="text-sm text-brand-soft">Cargando…</p>
        } @else if (!managedUsers().length) {
          <p class="text-sm text-brand-soft">No hay usuarios para gestionar aquí.</p>
        } @else {
          <div class="overflow-x-auto border border-slate-200">
            <table class="w-full min-w-[520px] text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wide text-brand-soft">
                <tr>
                  <th class="px-4 py-3 font-semibold">Nombre</th>
                  <th class="px-4 py-3 font-semibold">Rol</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (u of managedUsers(); track u.id) {
                  <tr>
                    <td class="px-4 py-3">
                      <p class="font-medium text-brand-ink">{{ u.nombre }}</p>
                      <p class="text-xs text-brand-soft">{{ u.email }}</p>
                    </td>
                    <td class="px-4 py-3">{{ roleLabel(u) }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex rounded px-2 py-0.5 text-xs font-semibold"
                        [class]="
                          u.activo
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-red-50 text-red-700'
                        "
                      >
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      @if (u.canEdit) {
                        <button
                          type="button"
                          class="btn-primary !px-3 !py-1.5 !text-xs"
                          (click)="openManage(u)"
                        >
                          Gestionar
                        </button>
                      } @else {
                        <span class="text-xs text-slate-400">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    @if (panel() === 'manage' && editing(); as u) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="closePanel()"
      >
        <div
          class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          (click)="$event.stopPropagation()"
          role="dialog"
        >
          <h2 class="text-lg font-semibold text-brand-ink">Gestionar usuario</h2>
          <p class="mt-1 text-sm text-brand-soft">{{ u.nombre }} · {{ roleLabel(u) }}</p>
          <p class="mt-1 text-xs">
            Estado:
            <span [class]="u.activo ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600'">
              {{ u.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </p>
          <div class="mt-5 grid gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 px-4 py-2.5 text-left text-sm font-semibold text-brand-ink hover:bg-surface-muted"
              (click)="openEdit(u)"
            >
              Editar datos
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 px-4 py-2.5 text-left text-sm font-semibold text-brand-ink hover:bg-surface-muted"
              (click)="openReset(u)"
            >
              Resetear contraseña
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 px-4 py-2.5 text-left text-sm font-semibold hover:bg-surface-muted"
              [class]="u.activo ? 'text-red-700' : 'text-emerald-700'"
              [disabled]="u.esOwner && u.activo"
              [title]="
                u.esOwner && u.activo ? 'No se puede desactivar al OWNER de la empresa' : ''
              "
              (click)="toggleActivo(u)"
            >
              {{ u.activo ? 'Desactivar usuario' : 'Activar usuario' }}
            </button>
            <button
              type="button"
              class="mt-2 rounded-md px-4 py-2 text-sm font-semibold text-brand-soft hover:bg-slate-50"
              (click)="closePanel()"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }

    @if (panel() === 'create' || panel() === 'edit') {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="closePanel()"
      >
        <div
          class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          (click)="$event.stopPropagation()"
          role="dialog"
        >
          <h2 class="text-lg font-semibold text-brand-ink">
            {{ panel() === 'create' ? 'Nuevo usuario' : 'Editar usuario' }}
          </h2>
          <form class="mt-4 grid gap-3" [formGroup]="form" (ngSubmit)="submitForm()">
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-brand-soft">Nombre *</span>
              <input class="field" formControlName="nombre" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-brand-soft">Email *</span>
              <input class="field" type="email" formControlName="email" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-brand-soft">Rol *</span>
              <select class="field" formControlName="role">
                @for (r of creatableRoles(); track r) {
                  <option [value]="r">{{ roleLabel({ role: r, esOwner: false }) }}</option>
                }
              </select>
            </label>
            @if (panel() === 'create') {
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-medium text-brand-soft">Contraseña *</span>
                  <button
                    type="button"
                    class="text-xs font-semibold text-accent hover:underline"
                    (click)="generatePassword()"
                  >
                    Generar aleatoria
                  </button>
                </div>
                <input
                  class="field font-mono"
                  type="text"
                  formControlName="password"
                  (input)="onPasswordInput()"
                />
                @if (form.controls.password.value) {
                  <p class="mt-1 text-xs font-semibold" [class]="'str-' + pwdStrength()">
                    {{ strengthLabel() }}
                  </p>
                }
              </div>
            }
            @if (formError()) {
              <p class="text-sm text-red-600">{{ formError() }}</p>
            }
            <div class="mt-2 flex gap-2">
              <button
                type="submit"
                class="btn-primary disabled:opacity-50"
                [disabled]="form.invalid || saving()"
              >
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
              <button
                type="button"
                class="btn-ghost border border-slate-200"
                (click)="closePanel()"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (panel() === 'reset') {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="closePanel()"
      >
        <div
          class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          (click)="$event.stopPropagation()"
          role="dialog"
        >
          <h2 class="text-lg font-semibold text-brand-ink">Resetear contraseña</h2>
          <form class="mt-4 grid gap-3" [formGroup]="resetForm" (ngSubmit)="submitReset()">
            <div>
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-medium text-brand-soft">Nueva contraseña *</span>
                <button
                  type="button"
                  class="text-xs font-semibold text-accent hover:underline"
                  (click)="generateResetPassword()"
                >
                  Generar aleatoria
                </button>
              </div>
              <input
                class="field font-mono"
                type="text"
                formControlName="newPassword"
                (input)="onResetPasswordInput()"
              />
              @if (resetForm.controls.newPassword.value) {
                <p class="mt-1 text-xs font-semibold" [class]="'str-' + resetStrength()">
                  {{ passwordStrengthLabel(resetStrength()) }}
                </p>
              }
            </div>
            @if (formError()) {
              <p class="text-sm text-red-600">{{ formError() }}</p>
            }
            <div class="mt-2 flex gap-2">
              <button
                type="submit"
                class="btn-primary disabled:opacity-50"
                [disabled]="resetForm.invalid || saving()"
              >
                {{ saving() ? 'Guardando…' : 'Resetear' }}
              </button>
              <button
                type="button"
                class="btn-ghost border border-slate-200"
                (click)="closePanel()"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (shareSummary(); as share) {
      <div
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="closeShare()"
      >
        <div
          class="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
          (click)="$event.stopPropagation()"
          role="dialog"
        >
          <h2 class="text-lg font-semibold text-brand-ink">Datos para compartir</h2>
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
      background: white;
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
  `,
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly empresasApi = inject(EmpresasService);

  readonly passwordStrengthLabel = passwordStrengthLabel;

  readonly users = signal<ManagedUser[]>([]);
  readonly empresas = signal<EmpresaListItem[]>([]);
  readonly empresaId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly panel = signal<PanelMode>('closed');
  readonly editing = signal<ManagedUser | null>(null);
  readonly shareSummary = signal<string | null>(null);
  readonly copied = signal(false);
  readonly pwdStrength = signal<PasswordStrength>('baja');
  readonly resetStrength = signal<PasswordStrength>('baja');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['ADMIN' as TenantManageRole, Validators.required],
    password: [''],
  });

  readonly resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly meNombre = computed(() => this.auth.currentUser?.nombre ?? '—');
  readonly meEmail = computed(() => this.auth.currentUser?.email ?? '');

  readonly managedUsers = computed(() => {
    const meId = this.auth.currentUser?.id;
    const rows = this.users().filter((u) => u.id !== meId);
    if (this.isPlatformSuper() || this.isEmpresaOwner()) {
      return rows;
    }
    // Administrador normal: solo rangos inferiores
    return rows.filter((u) => u.role === 'ASESOR' || u.role === 'TECNICO');
  });

  isPlatformSuper(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  /** Compat: alias usado en template anterior */
  isSuper(): boolean {
    return this.isPlatformSuper();
  }

  isEmpresaOwner(): boolean {
    const u = this.auth.currentUser;
    if (!u || u.role !== 'ADMIN') return false;
    if (u.esOwner) return true;
    return Boolean(this.users().find((x) => x.id === u.id)?.esOwner);
  }

  meRoleLabel(): string {
    const u = this.auth.currentUser;
    if (!u) return '';
    if (u.role === 'SUPER_ADMIN') return 'SUPER ADMIN';
    if (u.role === 'ADMIN') {
      if (this.isEmpresaOwner()) return 'OWNER';
      return 'Administrador';
    }
    if (u.role === 'ASESOR') return 'Asesor';
    if (u.role === 'TECNICO') return 'Técnico';
    return u.role;
  }

  canCreate(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  creatableRoles(): TenantManageRole[] {
    if (this.isEmpresaOwner()) {
      return ['ADMIN', 'ASESOR', 'TECNICO'];
    }
    return ['ASESOR', 'TECNICO'];
  }

  ngOnInit(): void {
    if (this.isSuper()) {
      this.empresasApi.list().subscribe({
        next: (rows) => this.empresas.set(rows),
        error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar empresas'),
      });
    } else {
      this.empresaId.set(this.auth.currentUser?.empresaId ?? '');
      this.reload();
    }
  }

  onEmpresaChange(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.empresaId.set(v);
    if (v) this.reload();
    else this.users.set([]);
  }

  reload(): void {
    const eid = this.empresaId();
    if (this.isSuper() && !eid) return;
    this.loading.set(true);
    this.error.set(null);
    this.usuariosApi.list(this.isSuper() ? eid : undefined).subscribe({
      next: (rows) => {
        this.users.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar usuarios');
      },
    });
  }

  roleLabel(u: { role: string; esOwner?: boolean } | string): string {
    if (typeof u === 'string') {
      if (u === 'ADMIN') return 'Administrador';
      if (u === 'ASESOR') return 'Asesor';
      if (u === 'TECNICO') return 'Técnico';
      if (u === 'SUPER_ADMIN') return 'SUPER ADMIN';
      if (u === 'OWNER') return 'OWNER';
      return u;
    }
    if (u.esOwner) return 'OWNER';
    if (u.role === 'ADMIN') return 'Administrador';
    if (u.role === 'ASESOR') return 'Asesor';
    if (u.role === 'TECNICO') return 'Técnico';
    return u.role;
  }

  openManage(u: ManagedUser): void {
    this.formError.set(null);
    this.editing.set(u);
    this.panel.set('manage');
  }

  openCreate(): void {
    this.formError.set(null);
    this.editing.set(null);
    const role = this.creatableRoles()[0]!;
    this.form.reset({ nombre: '', email: '', role, password: '' });
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.generatePassword();
    this.panel.set('create');
  }

  openEdit(u: ManagedUser): void {
    this.formError.set(null);
    this.editing.set(u);
    this.form.reset({
      nombre: u.nombre,
      email: u.email,
      role: u.role,
      password: '',
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.panel.set('edit');
  }

  openReset(u: ManagedUser): void {
    this.formError.set(null);
    this.editing.set(u);
    this.resetForm.reset({ newPassword: '' });
    this.generateResetPassword();
    this.panel.set('reset');
  }

  closePanel(): void {
    this.panel.set('closed');
    this.editing.set(null);
    this.formError.set(null);
  }

  generatePassword(): void {
    const pw = generateStrongPassword(16);
    this.form.controls.password.setValue(pw);
    this.pwdStrength.set(passwordStrength(pw));
  }

  generateResetPassword(): void {
    const pw = generateStrongPassword(16);
    this.resetForm.controls.newPassword.setValue(pw);
    this.resetStrength.set(passwordStrength(pw));
  }

  onPasswordInput(): void {
    this.pwdStrength.set(passwordStrength(this.form.controls.password.value ?? ''));
  }

  onResetPasswordInput(): void {
    this.resetStrength.set(passwordStrength(this.resetForm.controls.newPassword.value ?? ''));
  }

  strengthLabel(): string {
    return passwordStrengthLabel(this.pwdStrength());
  }

  submitForm(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set(null);
    const v = this.form.getRawValue();

    if (this.panel() === 'create') {
      this.usuariosApi
        .create({
          nombre: v.nombre.trim(),
          email: v.email.trim(),
          password: v.password,
          role: v.role,
          empresaId: this.isSuper() ? this.empresaId() : undefined,
        })
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.closePanel();
            this.shareSummary.set(
              this.buildShare(res.user.nombre, res.user.email, res.password, res.user),
            );
            this.copied.set(false);
            this.reload();
          },
          error: (err) => {
            this.saving.set(false);
            this.formError.set(err?.error?.message ?? 'No se pudo crear');
          },
        });
      return;
    }

    const target = this.editing();
    if (!target) return;
    this.usuariosApi
      .update(target.id, {
        nombre: v.nombre.trim(),
        email: v.email.trim(),
        role: v.role,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closePanel();
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message ?? 'No se pudo actualizar');
        },
      });
  }

  submitReset(): void {
    const target = this.editing();
    if (!target || this.resetForm.invalid) return;
    this.saving.set(true);
    this.formError.set(null);
    const pw = this.resetForm.controls.newPassword.value;
    this.usuariosApi.resetPassword(target.id, pw).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.closePanel();
        this.shareSummary.set(
          this.buildShare(target.nombre, target.email, res.password, target),
        );
        this.copied.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo resetear');
      },
    });
  }

  toggleActivo(u: ManagedUser): void {
    this.usuariosApi.update(u.id, { activo: !u.activo }).subscribe({
      next: () => {
        this.closePanel();
        this.reload();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }

  buildShare(
    nombre: string,
    email: string,
    password: string,
    userOrRole: ManagedUser | string,
  ): string {
    const loginUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const roleText =
      typeof userOrRole === 'string' ? this.roleLabel(userOrRole) : this.roleLabel(userOrRole);
    return [
      `Ally Flow — acceso`,
      ``,
      `Nombre: ${nombre}`,
      `Email: ${email}`,
      `Rol: ${roleText}`,
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
