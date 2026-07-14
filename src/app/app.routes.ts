import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'suite',
        canActivate: [authGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/suite/suite.component').then((m) => m.SuiteComponent),
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      { path: 'empresa', redirectTo: 'perfil', pathMatch: 'full' },
      {
        path: 'usuarios',
        canActivate: [authGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/costos/costos.component').then((m) => m.CostosComponent),
      },
      { path: 'costos', redirectTo: 'admin', pathMatch: 'full' },
      {
        path: 'balance',
        canActivate: [authGuard],
        data: { roles: ['ADMIN', 'TECNICO'] },
        loadComponent: () =>
          import('./features/balance/balance.component').then((m) => m.BalanceComponent),
      },
      {
        path: 'casos/nuevo',
        canActivate: [authGuard],
        data: { roles: ['ASESOR', 'ADMIN'] },
        loadComponent: () =>
          import('./features/casos/caso-nuevo.component').then((m) => m.CasoNuevoComponent),
      },
      {
        path: 'casos/:id',
        loadComponent: () =>
          import('./features/casos/caso-detalle.component').then((m) => m.CasoDetalleComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
