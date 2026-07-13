import { Component, input, output } from '@angular/core';
import { LucideArrowRight, LucideX } from '@lucide/angular';

export interface ConfirmDialogPayload {
  /** Título principal */
  title?: string;
  /** Etiqueta origen (paso actual) — opcional */
  fromLabel?: string;
  /** Etiqueta destino (siguiente paso) — opcional */
  toLabel?: string;
  /** Líneas de detalle */
  lines: string[];
  /** Texto del botón confirmar */
  confirmLabel?: string;
  /** Estilo peligro (eliminar) */
  danger?: boolean;
}

/**
 * Modal de confirmación del producto (reemplaza window.confirm).
 * Misma UI que el avance de estados en caso-detalle.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideArrowRight, LucideX],
  template: `
    @if (payload(); as conf) {
      <div class="modal-backdrop" (click)="onCancel()">
        <div
          class="modal-panel"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirm-dialog-title'"
        >
          <h3 id="confirm-dialog-title" class="text-lg font-semibold text-brand-ink">
            {{ conf.title ?? '¿Confirmar?' }}
          </h3>

          @if (conf.fromLabel && conf.toLabel) {
            <p class="mt-2 text-sm text-brand-soft">
              <span class="font-semibold text-brand-ink">{{ conf.fromLabel }}</span>
              <span class="mx-1.5 text-slate-400">→</span>
              <span class="font-semibold text-emerald-800">{{ conf.toLabel }}</span>
            </p>
          }

          @if (conf.lines.length) {
            <ul
              class="mt-4 space-y-1.5 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-brand-ink"
            >
              @for (line of conf.lines; track $index) {
                <li>{{ line }}</li>
              }
            </ul>
          }

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="btn-ghost border border-slate-200"
              [disabled]="busy()"
              (click)="onCancel()"
            >
              <svg lucideX [size]="15"></svg>
              Cancelar
            </button>
            <button
              type="button"
              [class]="conf.danger ? 'btn-danger' : 'btn-estado'"
              [disabled]="busy()"
              (click)="confirmed.emit()"
            >
              @if (busy()) {
                <span class="spinner"></span>
                Procesando…
              } @else {
                @if (!conf.danger) {
                  <svg lucideArrowRight [size]="16"></svg>
                }
                {{ conf.confirmLabel ?? 'Confirmar' }}
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
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
    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 0.375rem;
      background: #b91c1c;
      padding: 0.55rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }
    .btn-danger:disabled {
      opacity: 0.6;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly payload = input<ConfirmDialogPayload | null>(null);
  readonly busy = input(false);
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  onCancel(): void {
    if (this.busy()) return;
    this.cancelled.emit();
  }
}
