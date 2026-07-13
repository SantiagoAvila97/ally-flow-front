import type { Permission } from './permissions';

export type Role = 'ADMIN' | 'ASESOR' | 'TECNICO' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  permissions: Permission[];
  /** Unix seconds — fin de sesión. */
  exp?: number;
}

export interface LoginResponse {
  user: User;
}

/** Claims (solo si se decodifica un Bearer de depuración). */
export interface JwtClaims {
  sub: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  permissions: Permission[];
  exp?: number;
  iat?: number;
}

export type { Permission };
