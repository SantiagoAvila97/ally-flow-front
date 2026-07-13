import { Component, input } from '@angular/core';

export type SkeletonVariant =
  | 'bandeja-filters'
  | 'bandeja-table'
  | 'caso-detalle'
  | 'costos-tarifas'
  | 'costos-pdf'
  | 'balance'
  | 'map-preview'
  | 'catalog-field'
  | 'lineas-table';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (variant()) {
      @case ('bandeja-filters') {
        <div class="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          <div class="skeleton h-10 sm:col-span-2 lg:col-span-2"></div>
          <div class="skeleton h-10"></div>
          <div class="skeleton h-10"></div>
          <div class="skeleton h-10"></div>
          <div class="skeleton h-10"></div>
          <div class="skeleton h-10 sm:col-span-2"></div>
        </div>
      }

      @case ('bandeja-table') {
        <div class="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft" aria-hidden="true">
          <div class="hidden min-w-[720px] sm:block">
            <div class="flex gap-4 border-b border-slate-200 bg-surface-muted/60 px-4 py-3">
              @for (h of [1, 2, 3, 4, 5, 6, 7]; track h) {
                <div class="skeleton h-3 flex-1"></div>
              }
            </div>
            @for (row of rowRange(); track row) {
              <div class="flex items-center gap-4 border-b border-slate-50 px-4 py-4">
                <div class="min-w-0 flex-[2] space-y-2">
                  <div class="skeleton h-4 w-4/5 max-w-xs"></div>
                  <div class="skeleton h-3 w-32"></div>
                </div>
                <div class="skeleton hidden h-3 flex-1 sm:block"></div>
                <div class="skeleton hidden h-3 flex-1 md:block"></div>
                <div class="skeleton h-6 w-24 shrink-0 rounded-full"></div>
                <div class="skeleton hidden h-3 w-16 lg:block"></div>
                <div class="skeleton h-8 w-20 shrink-0"></div>
              </div>
            }
          </div>
          <div class="sm:hidden space-y-3 p-4">
            @for (row of rowRange(); track row) {
              <div class="space-y-2 rounded-lg border border-slate-100 p-3">
                <div class="skeleton h-4 w-3/4"></div>
                <div class="skeleton h-3 w-1/2"></div>
                <div class="skeleton h-6 w-28 rounded-full"></div>
              </div>
            }
          </div>
        </div>
      }

      @case ('caso-detalle') {
        <div class="space-y-6" aria-hidden="true">
          <div class="space-y-3">
            <div class="skeleton h-8 w-2/3 max-w-md"></div>
            <div class="skeleton h-6 w-32 rounded-full"></div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="space-y-2">
                <div class="skeleton h-3 w-24"></div>
                <div class="skeleton h-4 w-40"></div>
              </div>
            }
          </div>
          <div class="skeleton h-40 w-full rounded-lg"></div>
          <div class="rounded-lg border border-slate-200 p-4 space-y-3">
            <div class="skeleton h-4 w-36"></div>
            <div class="skeleton h-10 w-full"></div>
            <div class="flex gap-2">
              <div class="skeleton h-9 w-28"></div>
              <div class="skeleton h-9 w-32"></div>
            </div>
          </div>
        </div>
      }

      @case ('costos-tarifas') {
        <div class="mt-8 space-y-4" aria-hidden="true">
          <div class="flex flex-wrap gap-2">
            @for (c of [1, 2, 3, 4, 5]; track c) {
              <div class="skeleton h-8 w-28 rounded-full"></div>
            }
          </div>
          @for (b of [1, 2]; track b) {
            <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
              <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
                <div class="flex-1 space-y-2">
                  <div class="skeleton h-5 w-40"></div>
                  <div class="skeleton h-3 w-56"></div>
                </div>
                <div class="flex gap-2">
                  <div class="skeleton h-8 w-16"></div>
                  <div class="skeleton h-8 w-8 rounded-md"></div>
                  <div class="skeleton h-8 w-8 rounded-md"></div>
                </div>
              </div>
              <div class="hidden overflow-x-auto md:block">
                <div class="flex gap-4 border-b border-slate-100 bg-surface-muted/40 px-4 py-2.5">
                  @for (h of [1, 2, 3, 4, 5, 6]; track h) {
                    <div class="skeleton h-3 flex-1"></div>
                  }
                </div>
                @for (r of [1, 2, 3]; track r) {
                  <div class="flex gap-4 border-t border-slate-50 px-4 py-3">
                    <div class="skeleton h-4 flex-[2]"></div>
                    <div class="skeleton h-4 w-12"></div>
                    <div class="skeleton h-4 w-16"></div>
                    <div class="skeleton h-4 w-16"></div>
                    <div class="skeleton h-5 w-14 rounded-full"></div>
                    <div class="skeleton h-8 w-16"></div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @case ('costos-pdf') {
        <div class="mt-6 space-y-4" aria-hidden="true">
          <div class="skeleton h-10 w-full"></div>
          <div class="grid gap-3 sm:grid-cols-2">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="skeleton h-10 w-full" [class.sm:col-span-2]="i === 1 || i === 6"></div>
            }
          </div>
          <div class="skeleton h-20 w-full"></div>
          <div class="skeleton ml-auto h-10 w-36"></div>
        </div>
      }

      @case ('balance') {
        <div class="mt-8 space-y-6" aria-hidden="true">
          <div class="grid gap-4 lg:grid-cols-3">
            @for (k of [1, 2, 3]; track k) {
              <div class="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div class="skeleton h-3 w-36"></div>
                <div class="skeleton h-8 w-32"></div>
                <div class="skeleton h-3 w-48"></div>
              </div>
            }
          </div>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div class="border-b border-slate-100 px-4 py-3">
              <div class="skeleton h-4 w-40"></div>
            </div>
            @for (r of [1, 2, 3, 4, 5]; track r) {
              <div class="flex gap-3 border-t border-slate-50 px-4 py-3">
                <div class="skeleton h-4 flex-1"></div>
                <div class="skeleton h-4 w-12"></div>
                <div class="skeleton h-4 w-20"></div>
                <div class="skeleton h-4 w-20"></div>
                <div class="skeleton h-4 w-20"></div>
              </div>
            }
          </div>
          <div class="grid gap-6 lg:grid-cols-3">
            @for (t of [1, 2, 3]; track t) {
              <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div class="border-b border-slate-100 px-4 py-3">
                  <div class="skeleton h-4 w-36"></div>
                </div>
                @for (r of [1, 2, 3]; track r) {
                  <div class="flex gap-3 border-t border-slate-50 px-4 py-3">
                    <div class="skeleton h-4 flex-1"></div>
                    <div class="skeleton h-4 w-16"></div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @case ('map-preview') {
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-hidden="true">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <div class="skeleton h-3 w-48"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
          <div class="skeleton h-56 w-full rounded-none"></div>
        </div>
      }

      @case ('catalog-field') {
        <div class="space-y-2" aria-hidden="true">
          <div class="skeleton h-3 w-24"></div>
          <div class="skeleton h-10 w-full max-w-md"></div>
        </div>
      }

      @case ('lineas-table') {
        <div class="overflow-x-auto" aria-hidden="true">
          <div class="w-full min-w-[520px] space-y-0">
            <div class="flex gap-2 border-b border-slate-200 pb-2">
              @for (h of [1, 2, 3, 4, 5, 6]; track h) {
                <div class="skeleton h-3 flex-1"></div>
              }
            </div>
            @for (row of rowRange(); track row) {
              <div class="flex items-center gap-2 border-b border-slate-50 py-3">
                <div class="skeleton h-4 flex-[2]"></div>
                <div class="skeleton h-4 w-12"></div>
                <div class="skeleton h-8 w-20"></div>
                <div class="skeleton h-4 w-16"></div>
                <div class="skeleton h-4 w-16"></div>
                <div class="skeleton h-8 w-8 rounded-md"></div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input.required<SkeletonVariant>();
  readonly rows = input(6);

  rowRange(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i + 1);
  }
}
