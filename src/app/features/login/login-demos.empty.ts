import type { LoginDemoEmpresa } from './login-demos.types';

export type { LoginDemoEmpresa, LoginDemoUser } from './login-demos.types';

/** Stub solo PROD — sin credenciales en el bundle. */
export const LOGIN_DEMOS: LoginDemoEmpresa[] = [];
