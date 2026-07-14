import { Pipe, PipeTransform } from '@angular/core';

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formato dinero Colombia: `$ 120.000` */
export function formatCop(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '$ 0';
  return COP.format(Math.round(Number(value)));
}

@Pipe({ name: 'cop', standalone: true })
export class CopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCop(value);
  }
}
