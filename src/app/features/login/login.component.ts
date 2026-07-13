import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideChevronDown, LucideLogIn } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

interface DemoUser {
  role: string;
  email: string;
  password: string;
}

interface DemoEmpresa {
  nombre: string;
  users: DemoUser[];
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, LucideLogIn, LucideChevronDown],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 lg:h-screen">
      <!-- Brand panel -->
      <aside
        class="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-brand px-10 py-12 text-white"
        aria-hidden="true"
      >
        <div class="pointer-events-none absolute inset-0 login-atmosphere"></div>
        <div class="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-accent/25 blur-3xl"></div>
        <div class="pointer-events-none absolute -left-24 bottom-8 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>

        <div class="relative z-10 flex w-full max-w-md flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Ally Flow"
            class="brand-logo-wide h-auto w-full max-w-[260px]"
          />
          <p class="mt-5 max-w-sm text-base leading-relaxed text-white/70">
            De la llamada al cobro, en un solo flujo.
          </p>

          <!-- Live status — única card, flota suave -->
          <div class="live-pill mt-10 w-full max-w-xs animate-float-soft">
            <div class="flex items-center justify-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-300"></span>
              </span>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-teal-100">En vivo</p>
            </div>
            <p class="mt-1.5 text-lg font-semibold tracking-tight">{{ liveLabel() }}</p>
            <p class="mt-0.5 text-xs text-white/60">{{ liveHint() }}</p>
          </div>

          <!-- 3 numbered steps -->
          <ol class="mt-8 w-full space-y-0">
            @for (step of steps; track step.n; let last = $last) {
              <li class="relative flex gap-4 text-left">
                <div class="flex flex-col items-center">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold tracking-wide backdrop-blur-sm"
                  >
                    {{ step.n }}
                  </span>
                  @if (!last) {
                    <span class="flow-rail my-1 w-px flex-1 min-h-[28px]"></span>
                  }
                </div>
                <div class="pb-6 pt-1.5">
                  <p class="text-sm font-semibold">{{ step.title }}</p>
                  <p class="mt-0.5 text-xs text-white/55">{{ step.hint }}</p>
                </div>
              </li>
            }
          </ol>

          <p class="mt-2 text-sm text-white/45">Operación clara. Resultados medibles. Equipos alineados.</p>
        </div>
      </aside>

      <!-- Form panel -->
      <main
        class="flex min-h-screen items-center justify-center overflow-y-auto px-6 py-10 lg:h-screen lg:min-h-0"
      >
        <div class="mx-auto w-full max-w-md">
          <!-- Mobile brand -->
          <div class="mb-8 lg:hidden">
            <div class="logo-plate logo-plate-light mx-auto w-fit">
              <img
                src="/logo.png"
                alt="Ally Flow"
                class="h-auto w-full max-w-[200px]"
              />
            </div>
            <div class="mt-5 flex items-start justify-between gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-soft">
              @for (step of steps; track step.n; let last = $last) {
                <div class="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white"
                  >
                    {{ step.n }}
                  </span>
                  <p class="mt-1.5 text-[11px] font-semibold leading-tight text-brand-ink">{{ step.short }}</p>
                </div>
                @if (!last) {
                  <span class="mt-3 h-px w-4 shrink-0 bg-slate-300" aria-hidden="true"></span>
                }
              }
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-soft sm:px-8">
            <div class="text-center">
              <div class="icon-plate mx-auto">
                <img
                  src="/icon.png"
                  alt=""
                  class="h-12 w-12 object-contain"
                  width="48"
                  height="48"
                />
              </div>
              <h1 class="mt-4 text-2xl font-semibold text-brand-ink sm:text-3xl">Bienvenido</h1>
              <p class="mt-1.5 text-sm text-brand-soft/80">
                Inicia sesión y lleva tu equipo de punta a punta.
              </p>
            </div>

            <form class="mt-8 space-y-5 text-left" [formGroup]="form" (ngSubmit)="onSubmit()">
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-brand-soft">Email</span>
                <input
                  type="email"
                  formControlName="email"
                  autocomplete="username"
                  class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-brand-ink
                         outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="admin@fullsoluciones.com"
                />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-brand-soft">Contraseña</span>
                <input
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-brand-ink
                         outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••"
                />
              </label>

              @if (error()) {
                <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {{ error() }}
                </p>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <span class="spinner"></span>
                  Entrando…
                } @else {
                  <svg lucideLogIn [size]="16"></svg>
                  Iniciar sesión
                }
              </button>
            </form>

            <!-- Collapsible demos -->
            <div class="mt-8 border-t border-slate-100 pt-5">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1.5 text-left text-sm font-semibold text-brand-soft transition hover:text-brand-ink"
                (click)="demosOpen.set(!demosOpen())"
                [attr.aria-expanded]="demosOpen()"
              >
                <span>Probar con una empresa demo</span>
                <svg
                  lucideChevronDown
                  [size]="16"
                  class="shrink-0 text-slate-400 transition"
                  [class.rotate-180]="demosOpen()"
                ></svg>
              </button>

              @if (demosOpen()) {
                <div class="mt-4 space-y-4">
                  <!-- Company chips -->
                  <div class="flex flex-wrap gap-2">
                    @for (emp of demos; track emp.nombre) {
                      <button
                        type="button"
                        class="rounded-md border px-3 py-1.5 text-xs font-semibold transition"
                        [class.border-accent]="demoEmpresa() === emp.nombre"
                        [class.bg-accent-soft]="demoEmpresa() === emp.nombre"
                        [class.text-accent]="demoEmpresa() === emp.nombre"
                        [class.border-slate-200]="demoEmpresa() !== emp.nombre"
                        [class.text-brand-soft]="demoEmpresa() !== emp.nombre"
                        [class.hover:bg-surface-muted]="demoEmpresa() !== emp.nombre"
                        (click)="demoEmpresa.set(emp.nombre)"
                      >
                        {{ emp.nombre }}
                      </button>
                    }
                  </div>

                  @if (activeDemo(); as emp) {
                    <ul class="space-y-1">
                      @for (u of emp.users; track u.email) {
                        <li>
                          <button
                            type="button"
                            class="btn-ghost w-full justify-start text-sm"
                            (click)="fillDemo(u.email, u.password)"
                          >
                            {{ u.role }} — {{ u.email }}
                          </button>
                        </li>
                      }
                    </ul>
                    <p class="text-[11px] text-slate-500">
                      Los datos de cada empresa no se cruzan entre sí.
                    </p>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .login-atmosphere {
        background:
          radial-gradient(circle at 20% 25%, rgb(15 118 110 / 0.5), transparent 45%),
          radial-gradient(circle at 85% 15%, rgb(255 255 255 / 0.1), transparent 38%),
          linear-gradient(165deg, rgb(7 20 34 / 0.4), transparent 55%);
      }

      .brand-logo-wide {
        display: block;
        background: transparent;
      }

      .logo-plate {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.85rem;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 0.65rem 0.9rem;
        box-shadow: 0 10px 28px -18px rgb(15 42 68 / 0.35);
      }

      .logo-plate img {
        display: block;
        border-radius: 0.4rem;
      }

      .logo-plate-light {
        border-color: #e2e8f0;
        background: #f8fafc;
      }

      .icon-plate {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 4rem;
        width: 4rem;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        background: #f1f5f9;
        box-shadow: 0 8px 20px -14px rgb(15 42 68 / 0.35);
      }

      .icon-plate img {
        display: block;
        border-radius: 0.5rem;
      }

      .live-pill {
        border-radius: 1rem;
        border: 1px solid rgb(204 251 241 / 0.35);
        background: linear-gradient(145deg, rgb(15 118 110 / 0.65), rgb(30 58 95 / 0.85));
        padding: 1rem 1.25rem;
        box-shadow: 0 0 0 1px rgb(255 255 255 / 0.06), 0 20px 50px -24px rgb(15 118 110 / 0.9);
        backdrop-filter: blur(8px);
        will-change: transform;
      }

      .flow-rail {
        background: linear-gradient(
          to bottom,
          rgb(204 251 241 / 0.55),
          rgb(204 251 241 / 0.12)
        );
        background-size: 100% 200%;
        animation: railFlow 2.8s ease-in-out infinite;
      }

      @keyframes railFlow {
        0%,
        100% {
          background-position: 0 0;
          opacity: 0.55;
        }
        50% {
          background-position: 0 100%;
          opacity: 1;
        }
      }

      @keyframes floatSoft {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .animate-float-soft {
        animation: floatSoft 4.2s ease-in-out infinite;
      }
    `,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly demosOpen = signal(false);
  readonly demoEmpresa = signal('Full Soluciones');
  readonly liveLabel = signal('Caso #AF-2401');
  readonly liveHint = signal('Asignando técnico…');

  readonly steps = [
    { n: '01', title: 'Lead / llamada', short: 'Lead', hint: 'El asesor captura la ficha' },
    { n: '02', title: 'Campo', short: 'Campo', hint: 'Técnico, evidencia y firma' },
    { n: '03', title: 'Cobro', short: 'Cobro', hint: 'Recaudo, costos y balance' },
  ];

  readonly demos: DemoEmpresa[] = [
    {
      nombre: 'Full Soluciones',
      users: [
        { role: 'ADMIN', email: 'admin@fullsoluciones.com', password: 'admin123' },
        { role: 'ASESOR', email: 'asesor@fullsoluciones.com', password: 'asesor123' },
        { role: 'TECNICO', email: 'tecnico@fullsoluciones.com', password: 'tecnico123' },
      ],
    },
    {
      nombre: 'Norte Seguros',
      users: [
        { role: 'ADMIN', email: 'admin@norteseguros.com', password: 'admin123' },
        { role: 'ASESOR', email: 'asesor@norteseguros.com', password: 'asesor123' },
        { role: 'TECNICO', email: 'tecnico@norteseguros.com', password: 'tecnico123' },
      ],
    },
  ];

  private liveTimer?: ReturnType<typeof setInterval>;
  private readonly liveFrames = [
    { label: 'Caso #AF-2401', hint: 'Asignando técnico…' },
    { label: 'En gestión', hint: 'Evidencias en campo' },
    { label: 'Documento de cobro', hint: 'Armando PDF oficial' },
    { label: 'Confirmación asegurado', hint: 'Esperando OK' },
    { label: 'Recepción de pago', hint: 'Pendiente de cobro' },
    { label: 'Cobrado', hint: 'Balance actualizado' },
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  activeDemo(): DemoEmpresa | undefined {
    return this.demos.find((d) => d.nombre === this.demoEmpresa());
  }

  ngOnInit(): void {
    let i = 0;
    this.liveTimer = setInterval(() => {
      i = (i + 1) % this.liveFrames.length;
      this.liveLabel.set(this.liveFrames[i].label);
      this.liveHint.set(this.liveFrames[i].hint);
    }, 2600);
  }

  ngOnDestroy(): void {
    if (this.liveTimer) clearInterval(this.liveTimer);
  }

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.error.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo iniciar sesión');
      },
      complete: () => this.loading.set(false),
    });
  }
}
