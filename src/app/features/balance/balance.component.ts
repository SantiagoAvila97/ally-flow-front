import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [],
  template: `
    <main class="mx-auto max-w-6xl px-6 py-8">
      <div>
        <h1 class="text-3xl font-semibold text-brand-ink">Balance general</h1>
        <p class="mt-1 text-brand-soft/80">
          Resumen operativo y comercial de {{ auth.currentUser?.empresaNombre }}. Filtros por fecha en el siguiente sprint.
        </p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        @for (k of kpis; track k.label) {
          <div class="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-soft">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ k.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-brand-ink">{{ k.value }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ k.hint }}</p>
          </div>
        }
      </div>

      <div class="mt-8 rounded-lg border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
        <p class="text-sm font-semibold text-brand-ink">Próximamente: rango de fechas e ingresos vs costos</p>
        <p class="mt-2 text-sm text-brand-soft">
          Aquí verás cobrados, pendientes de recaudo y margen por categoría de servicio.
        </p>
      </div>
    </main>
  `,
})
export class BalanceComponent {
  readonly auth = inject(AuthService);

  readonly kpis = [
    { label: 'Casos del mes', value: '—', hint: 'Conectará al listado filtrado' },
    { label: 'Pendiente recaudo', value: '—', hint: 'Suma estimada' },
    { label: 'Cobrado', value: '—', hint: 'Ingresos confirmados' },
  ];
}
