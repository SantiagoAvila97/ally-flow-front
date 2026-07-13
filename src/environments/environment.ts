export type AppDeployEnv = 'local' | 'qa' | 'prod';

/**
 * ng serve → API local.
 * Preview Vercel → QA; Production → PROD (via environment.runtime).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  /** Credenciales demo en login (solo este archivo / ng serve). */
  showDemoLogins: true,
  appEnv: 'local' as AppDeployEnv,
};
