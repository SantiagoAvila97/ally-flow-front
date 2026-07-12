export type Role = 'ADMIN' | 'ASESOR' | 'TECNICO';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string;
  empresaNombre: string;
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
  empresaId: string;
  empresaNombre: string;
  exp?: number;
  iat?: number;
}
