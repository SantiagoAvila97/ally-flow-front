import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { EmpresasService, type Empresa } from '../../core/services/empresas.service';
import {
  generateStrongPassword,
  passwordStrength,
  passwordStrengthLabel,
  type PasswordStrength,
} from '../../core/utils/password';
import { readSquareLogoFile } from '../../core/utils/logo-file';
import { environment } from '../../../environments/environment';
import {
  ConfirmDialogComponent,
  type ConfirmDialogPayload,
} from '../../shared/confirm-dialog.component';

const EMPRESA_DEMO_ID = 'emp-demo';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="mx-auto max-w-lg px-6 py-10">
      <header class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-wider text-brand/70">Cuenta</p>
        <h1 class="mt-1 text-3xl font-semibold text-brand-ink">Perfil</h1>
        <p class="mt-2 text-sm text-brand-soft">
          {{ auth.currentUser?.nombre }} · {{ auth.currentUser?.email }}
        </p>
      </header>

      @if (canEditLogo()) {
        <section class="mb-10 border-b border-slate-200 pb-10">
          <h2 class="mb-1 text-lg font-semibold text-brand-ink">Logo de la empresa</h2>
          <p class="mb-4 text-sm text-brand-soft">
            Se muestra en el header al ingresar y en los PDF de cobro (esquina superior derecha).
            Debe ser cuadrado (1:1).
          </p>

          @if (logoError()) {
            <p class="mb-3 text-sm text-red-600">{{ logoError() }}</p>
          }
          @if (logoOk()) {
            <p class="mb-3 text-sm font-medium text-emerald-700">Logo actualizado.</p>
          }

          <div class="flex flex-wrap items-start gap-4">
            <label
              class="group relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-brand hover:bg-white"
              [class.border-solid]="!!(logoPreview() || empresa()?.logoDataUrl)"
              [class.border-slate-200]="!!(logoPreview() || empresa()?.logoDataUrl)"
              title="Cambiar logo"
            >
              @if (logoPreview() || empresa()?.logoDataUrl) {
                <img
                  [src]="logoPreview() || empresa()!.logoDataUrl!"
                  alt="Logo empresa"
                  class="h-full w-full object-cover"
                />
                <span
                  class="absolute inset-0 flex items-center justify-center bg-black/40 text-2xl font-light text-white opacity-0 transition group-hover:opacity-100"
                  >+</span
                >
              } @else {
                <span class="text-3xl font-light leading-none text-slate-400">+</span>
                <span class="mt-1 text-[10px] font-medium text-slate-400">Agregar</span>
              }
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                [disabled]="logoSaving()"
                (change)="onLogoFile($event)"
              />
            </label>
            <div class="max-w-xs text-xs leading-relaxed text-brand-soft">
              <p>
                Empresa:
                <span class="font-semibold text-brand-ink">{{
                  empresa()?.nombre || auth.currentUser?.empresaNombre || '—'
                }}</span>
              </p>
              <p class="mt-2">PNG, JPG o WEBP · 1:1 · máx. 800KB.</p>
              @if (pendingLogo()) {
                <button
                  type="button"
                  class="btn-primary mt-3 disabled:opacity-50"
                  [disabled]="logoSaving()"
                  (click)="saveLogo()"
                >
                  {{ logoSaving() ? 'Guardando…' : 'Guardar logo' }}
                </button>
              }
            </div>
          </div>
        </section>
      }

      @if (canClearData()) {
        <section class="mb-10 border-b border-slate-200 pb-10">
          <h2 class="mb-1 text-lg font-semibold text-brand-ink">Limpiar data</h2>
          <p class="mb-4 text-sm text-brand-soft">
            Elimina casos, tarifas, clientes y plantillas de
            <span class="font-semibold text-brand-ink">{{
              empresa()?.nombre || auth.currentUser?.empresaNombre || 'tu empresa'
            }}</span
            >. Conserva usuarios y logo. Solo disponible en QA / local.
          </p>
          @if (clearError()) {
            <p class="mb-3 text-sm text-red-600">{{ clearError() }}</p>
          }
          @if (clearOk()) {
            <p class="mb-3 text-sm font-medium text-emerald-700">{{ clearOk() }}</p>
          }
          <button
            type="button"
            class="btn-ghost border border-red-200 text-red-800 hover:bg-red-50 disabled:opacity-50"
            [disabled]="dataBusy()"
            (click)="pedirClearData()"
          >
            {{ clearBusy() ? 'Limpiando…' : 'Limpiar data' }}
          </button>
        </section>
      }

      @if (canResetDemo()) {
        <section class="mb-10 border-b border-slate-200 pb-10">
          <h2 class="mb-1 text-lg font-semibold text-brand-ink">Datos DEMO</h2>
          <p class="mb-4 text-sm text-brand-soft">
            Restaura casos, tarifas, clientes, plantilla PDF y usuarios demo a los valores por
            defecto. No afecta Full Soluciones ni otras empresas. Solo QA / local.
          </p>
          @if (demoError()) {
            <p class="mb-3 text-sm text-red-600">{{ demoError() }}</p>
          }
          @if (demoOk()) {
            <p class="mb-3 text-sm font-medium text-emerald-700">{{ demoOk() }}</p>
          }
          <button
            type="button"
            class="btn-ghost border border-amber-300 text-amber-900 hover:bg-amber-50 disabled:opacity-50"
            [disabled]="dataBusy()"
            (click)="pedirResetDemo()"
          >
            {{ demoResetting() ? 'Reiniciando…' : 'Reiniciar datos DEMO' }}
          </button>
        </section>
      }

      <section>
        <h2 class="mb-4 text-lg font-semibold text-brand-ink">Cambiar contraseña</h2>
        <form class="grid gap-4" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Contraseña actual *</span>
            <input
              class="field"
              type="password"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
          </label>

          <div>
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-brand-soft">Nueva contraseña *</span>
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
              formControlName="newPassword"
              autocomplete="new-password"
              (input)="onNewPasswordInput()"
            />
            @if (form.controls.newPassword.value) {
              <p class="mt-1.5 text-xs font-semibold" [class]="strengthCss()">
                {{ strengthText() }}
              </p>
            }
          </div>

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-brand-soft">Confirmar nueva *</span>
            <input
              class="field font-mono"
              type="text"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
          </label>

          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }
          @if (ok()) {
            <p class="text-sm font-medium text-emerald-700">Contraseña actualizada.</p>
          }

          <button
            type="submit"
            class="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            [disabled]="form.invalid || saving() || !passwordsMatch()"
          >
            {{ saving() ? 'Guardando…' : 'Guardar contraseña' }}
          </button>
          @if (form.controls.confirmPassword.value && !passwordsMatch()) {
            <p class="text-xs text-red-600">Las contraseñas no coinciden.</p>
          }
        </form>
      </section>
    </div>

    <app-confirm-dialog
      [payload]="confirmDialog()"
      [busy]="dataBusy()"
      (cancelled)="cerrarConfirmDialog()"
      (confirmed)="ejecutarConfirmDialog()"
    />
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
  `,
})
export class PerfilComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly empresasApi = inject(EmpresasService);
  private readonly catalogos = inject(CatalogosService);

  /** Limpiar / reiniciar DEMO: nunca en build PROD. */
  private readonly qaDataTools = environment.appEnv !== 'prod';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal(false);
  readonly strength = signal<PasswordStrength>('baja');

  readonly empresa = signal<Empresa | null>(null);
  readonly pendingLogo = signal<string | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly logoSaving = signal(false);
  readonly logoError = signal<string | null>(null);
  readonly logoOk = signal(false);

  readonly demoResetting = signal(false);
  readonly demoError = signal<string | null>(null);
  readonly demoOk = signal<string | null>(null);
  readonly clearBusy = signal(false);
  readonly clearError = signal<string | null>(null);
  readonly clearOk = signal<string | null>(null);
  readonly confirmDialog = signal<ConfirmDialogPayload | null>(null);
  private confirmAction: (() => void) | null = null;

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  dataBusy(): boolean {
    return this.demoResetting() || this.clearBusy();
  }

  canEditLogo(): boolean {
    const u = this.auth.currentUser;
    return Boolean(u?.role === 'ADMIN' && u.esOwner);
  }

  canClearData(): boolean {
    return this.qaDataTools && this.canEditLogo();
  }

  canResetDemo(): boolean {
    if (!this.qaDataTools) return false;
    const u = this.auth.currentUser;
    if (!u) return false;
    if (u.role === 'SUPER_ADMIN') return true;
    return Boolean(u.role === 'ADMIN' && u.esOwner && u.empresaId === EMPRESA_DEMO_ID);
  }

  ngOnInit(): void {
    if (!this.canEditLogo()) return;
    this.empresasApi.me().subscribe({
      next: (e) => this.empresa.set(e),
      error: () => this.empresa.set(null),
    });
  }

  pedirClearData(): void {
    const nombre = this.empresa()?.nombre || this.auth.currentUser?.empresaNombre || 'la empresa';
    this.clearError.set(null);
    this.clearOk.set(null);
    this.confirmDialog.set({
      title: '¿Limpiar data?',
      lines: [
        `Empresa: ${nombre}`,
        'Se eliminan casos, tarifas, clientes y plantillas.',
        'Se conservan usuarios y logo.',
      ],
      confirmLabel: 'Limpiar data',
      danger: true,
    });
    this.confirmAction = () => this.runClearData();
  }

  pedirResetDemo(): void {
    this.demoError.set(null);
    this.demoOk.set(null);
    this.confirmDialog.set({
      title: '¿Reiniciar datos DEMO?',
      lines: [
        'Se restauran casos, tarifas, clientes, plantilla y usuarios demo.',
        'Se pierden los cambios hechos en DEMO.',
        'Full Soluciones y otras empresas no se tocan.',
      ],
      confirmLabel: 'Reiniciar DEMO',
      danger: true,
    });
    this.confirmAction = () => this.runResetDemo();
  }

  cerrarConfirmDialog(): void {
    this.confirmDialog.set(null);
    this.confirmAction = null;
  }

  ejecutarConfirmDialog(): void {
    const action = this.confirmAction;
    this.cerrarConfirmDialog();
    action?.();
  }

  private runClearData(): void {
    this.clearBusy.set(true);
    this.clearError.set(null);
    this.clearOk.set(null);
    this.empresasApi.clearMineData().subscribe({
      next: (r) => {
        this.clearBusy.set(false);
        this.catalogos.invalidate();
        this.clearOk.set(`Data de ${r.empresaNombre} limpiada.`);
      },
      error: (err) => {
        this.clearBusy.set(false);
        this.clearError.set(err?.error?.message ?? 'No se pudo limpiar la data');
      },
    });
  }

  private runResetDemo(): void {
    this.demoResetting.set(true);
    this.demoError.set(null);
    this.demoOk.set(null);
    this.empresasApi.resetDemo().subscribe({
      next: (r) => {
        this.demoResetting.set(false);
        this.catalogos.invalidate();
        this.demoOk.set(
          `DEMO restaurado: ${r.casos} casos y ${r.users} usuarios por defecto.`,
        );
        if (this.canEditLogo()) {
          this.empresasApi.me().subscribe({
            next: (e) => {
              this.empresa.set(e);
              window.dispatchEvent(
                new CustomEvent('ally-empresa-logo', { detail: e.logoDataUrl }),
              );
            },
          });
        }
      },
      error: (err) => {
        this.demoResetting.set(false);
        this.demoError.set(err?.error?.message ?? 'No se pudo reiniciar DEMO');
      },
    });
  }

  async onLogoFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.logoError.set(null);
    this.logoOk.set(false);
    if (!file) return;
    try {
      const dataUrl = await readSquareLogoFile(file);
      this.pendingLogo.set(dataUrl);
      this.logoPreview.set(dataUrl);
    } catch (e) {
      this.pendingLogo.set(null);
      this.logoPreview.set(null);
      this.logoError.set(e instanceof Error ? e.message : 'Logo inválido');
      input.value = '';
    }
  }

  saveLogo(): void {
    const logo = this.pendingLogo();
    if (!logo) return;
    this.logoSaving.set(true);
    this.logoError.set(null);
    this.empresasApi.updateLogo(logo).subscribe({
      next: (e) => {
        this.empresa.set(e);
        this.pendingLogo.set(null);
        this.logoPreview.set(null);
        this.logoSaving.set(false);
        this.logoOk.set(true);
        window.dispatchEvent(new CustomEvent('ally-empresa-logo', { detail: e.logoDataUrl }));
      },
      error: (err) => {
        this.logoSaving.set(false);
        this.logoError.set(err?.error?.message ?? 'No se pudo guardar el logo');
      },
    });
  }

  strengthText(): string {
    return passwordStrengthLabel(this.strength());
  }

  strengthCss(): string {
    return `str-${this.strength()}`;
  }

  passwordsMatch(): boolean {
    const v = this.form.getRawValue();
    return v.newPassword === v.confirmPassword;
  }

  onNewPasswordInput(): void {
    this.strength.set(passwordStrength(this.form.controls.newPassword.value ?? ''));
  }

  generatePassword(): void {
    const pw = generateStrongPassword(16);
    this.form.patchValue({ newPassword: pw, confirmPassword: pw });
    this.strength.set(passwordStrength(pw));
  }

  onSubmit(): void {
    if (this.form.invalid || !this.passwordsMatch()) return;
    this.saving.set(true);
    this.error.set(null);
    this.ok.set(false);
    const v = this.form.getRawValue();
    this.auth.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set(true);
        this.form.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        this.strength.set('baja');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cambiar la contraseña');
      },
    });
  }
}
