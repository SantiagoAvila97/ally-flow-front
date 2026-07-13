export type Role = 'ADMIN' | 'ASESOR' | 'TECNICO' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Claims decodificados del JWT (sin verificar firma en cliente). */
export interface JwtClaims {
  sub: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  exp?: number;
  iat?: number;
}
