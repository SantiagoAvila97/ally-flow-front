export type AppDeployEnv = 'local' | 'qa' | 'prod';

/**
 * ng serve → misma API/datos que QA (Railway).
 * Así lo que haces en localhost:4200 queda en QA al instante.
 * (No uses el API local :3000 para datos; ese proceso tiene otra copia en memoria.)
 */
export const environment = {
  production: false,
  apiUrl: 'https://ally-flow-back-qa.up.railway.app/api',
  /** Credenciales demo en login (solo este archivo / ng serve). */
  showDemoLogins: true,
  /** Badge LOCAL = estás en ng serve; los datos son los de QA. */
  appEnv: 'local' as AppDeployEnv,
};
