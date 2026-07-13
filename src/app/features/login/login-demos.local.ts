import type { LoginDemoEmpresa } from './login-demos.types';

export type { LoginDemoEmpresa, LoginDemoUser } from './login-demos.types';

/** Credenciales demo — solo builds locales (development). */
export const LOGIN_DEMOS: LoginDemoEmpresa[] = [
  {
    nombre: 'DEMO',
    users: [
      { role: 'ADMIN', email: 'admin@demo.local', password: 'admin123' },
      { role: 'ASESOR', email: 'asesor@demo.local', password: 'asesor123' },
      { role: 'TECNICO', email: 'tecnico@demo.local', password: 'tecnico123' },
    ],
  },
  {
    nombre: 'Full Soluciones',
    users: [
      { role: 'ADMIN', email: 'admin@fullsoluciones.com', password: 'admin123' },
      { role: 'ASESOR', email: 'asesor@fullsoluciones.com', password: 'asesor123' },
      { role: 'TECNICO', email: 'tecnico@fullsoluciones.com', password: 'tecnico123' },
    ],
  },
];
