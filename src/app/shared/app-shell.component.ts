import { Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideChevronDown,
  LucideInbox,
  LucideLogOut,
  LucideScale,
  LucideTags,
  LucideUser,
} from '@lucide/angular';
import { AuthService } from '../core/services/auth.service';
import type { Role } from '../core/models/user.model';

interface NavItem {
  label: string;
  path: string;
  roles: Role[];
  icon: 'inbox' | 'tags' | 'scale';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideChevronDown,
    LucideInbox,
    LucideLogOut,
    LucideScale,
    LucideTags,
    LucideUser,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div class="flex min-w-0 items-center gap-8">
            <a routerLink="/home" class="flex min-w-0 shrink-0 items-center gap-2.5">
              <img
                src="/icon.png"
                alt=""
                class="h-9 w-9 shrink-0 rounded-lg object-cover shadow-sm"
                width="36"
                height="36"
              />
              <span class="min-w-0 leading-tight">
                <span class="block truncate text-base font-semibold text-brand-ink sm:text-lg">
                  {{ auth.currentUser?.empresaNombre }}
                </span>
                <span class="block text-[11px] font-semibold tracking-wide text-brand/60">Ally Flow</span>
              </span>
            </a>

            <nav class="hidden items-center gap-1 md:flex" aria-label="Principal">
              @for (item of navItems(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="nav-active"
                  [routerLinkActiveOptions]="{ exact: item.path === '/home' }"
                  class="nav-link"
                >
                  @switch (item.icon) {
                    @case ('inbox') {
                      <svg lucideInbox [size]="15"></svg>
                    }
                    @case ('tags') {
                      <svg lucideTags [size]="15"></svg>
                    }
                    @case ('scale') {
                      <svg lucideScale [size]="15"></svg>
                    }
                  }
                  {{ item.label }}
                </a>
              }
            </nav>
          </div>

          <div class="relative" #menuRoot>
            <button
              type="button"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-surface-muted"
              (click)="menuOpen.set(!menuOpen()); $event.stopPropagation()"
              [attr.aria-expanded]="menuOpen()"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
              >
                {{ initials() }}
              </span>
              <span class="hidden sm:block">
                <span class="block text-sm font-semibold text-brand-ink">{{ auth.currentUser?.nombre }}</span>
                <span class="block text-[11px] uppercase tracking-wide text-accent">{{
                  auth.currentUser?.role
                }}</span>
              </span>
              <svg
                lucideChevronDown
                [size]="16"
                class="text-slate-400 transition"
                [class.rotate-180]="menuOpen()"
              ></svg>
            </button>

            @if (menuOpen()) {
              <div
                class="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-soft"
                role="menu"
              >
                <div class="border-b border-slate-100 px-3 py-2 md:hidden">
                  @for (item of navItems(); track item.path) {
                    <a
                      [routerLink]="item.path"
                      class="flex items-center gap-2 rounded px-2 py-2 text-sm text-brand-soft hover:bg-surface-muted"
                      (click)="menuOpen.set(false)"
                    >
                      @switch (item.icon) {
                        @case ('inbox') {
                          <svg lucideInbox [size]="15"></svg>
                        }
                        @case ('tags') {
                          <svg lucideTags [size]="15"></svg>
                        }
                        @case ('scale') {
                          <svg lucideScale [size]="15"></svg>
                        }
                      }
                      {{ item.label }}
                    </a>
                  }
                </div>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-soft hover:bg-surface-muted"
                  role="menuitem"
                  disabled
                >
                  <svg lucideUser [size]="15"></svg>
                  Perfil (próximamente)
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                  role="menuitem"
                  (click)="auth.logout()"
                >
                  <svg lucideLogOut [size]="15"></svg>
                  Cerrar sesión
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <div class="flex-1">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--brand-soft);
        transition: background 0.15s, color 0.15s;
      }
      .nav-link:hover {
        background: var(--surface-muted);
        color: var(--brand-ink);
      }
      .nav-active {
        background: var(--accent-soft);
        color: var(--accent);
      }
    `,
  ],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  private readonly menuRoot = viewChild<ElementRef<HTMLElement>>('menuRoot');

  private readonly allNav: NavItem[] = [
    { label: 'Bandeja', path: '/home', roles: ['ADMIN', 'ASESOR', 'TECNICO'], icon: 'inbox' },
    { label: 'Costos', path: '/costos', roles: ['ADMIN'], icon: 'tags' },
    { label: 'Balance', path: '/balance', roles: ['ADMIN'], icon: 'scale' },
  ];

  readonly navItems = computed(() => {
    const role = this.auth.currentUser?.role;
    if (!role) return [];
    return this.allNav.filter((n) => n.roles.includes(role));
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser?.nombre ?? '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    const root = this.menuRoot()?.nativeElement;
    if (!root?.contains(ev.target as Node)) {
      this.menuOpen.set(false);
    }
  }
}
