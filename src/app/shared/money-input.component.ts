import { Component, ElementRef, Input, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatCop } from './cop.pipe';

/** Solo dígitos → número entero ≥ 0, o null si vacío. */
export function parseMoneyInput(raw: string): number | null {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** Formato COP visible en el input (`$ 80.000`). Vacío si no hay valor. */
export function formatMoneyInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '';
  return formatCop(value);
}

@Component({
  selector: 'app-money-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoneyInputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      #el
      class="money-field"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      [attr.name]="name || null"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [attr.required]="required ? '' : null"
      [value]="display"
      (input)="onType($any($event.target).value)"
      (blur)="onBlur()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .money-field {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        background: #fff;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #0f172a;
        font-variant-numeric: tabular-nums;
        outline: none;
      }
      .money-field::placeholder {
        color: #94a3b8;
      }
      .money-field:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgb(15 118 110 / 0.15);
      }
      .money-field:disabled {
        background: #f8fafc;
        color: #64748b;
        cursor: not-allowed;
      }
    `,
  ],
})
export class MoneyInputComponent implements ControlValueAccessor {
  @ViewChild('el') private el?: ElementRef<HTMLInputElement>;

  @Input() name = '';
  @Input() placeholder = 'Ej. $ 80.000';
  @Input() required = false;

  display = '';
  disabled = false;
  private value: number | null = null;

  private onChange: (v: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(v: number | null | undefined): void {
    this.value = v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v));
    this.display = formatMoneyInput(this.value);
    queueMicrotask(() => this.syncDom());
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onType(raw: string): void {
    const next = parseMoneyInput(raw);
    this.value = next;
    this.display = formatMoneyInput(next);
    this.onChange(next);
    // Mantener el valor formateado en el DOM (COP) al escribir.
    queueMicrotask(() => {
      this.syncDom();
      const input = this.el?.nativeElement;
      if (input) {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });
  }

  onBlur(): void {
    this.onTouched();
    this.display = formatMoneyInput(this.value);
    this.syncDom();
  }

  private syncDom(): void {
    const input = this.el?.nativeElement;
    if (input && input.value !== this.display) {
      input.value = this.display;
    }
  }
}
