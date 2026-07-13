export type AppDeployEnv = 'local' | 'qa' | 'prod';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  /** Credenciales demo en login (solo desarrollo). */
  showDemoLogins: true,
  appEnv: 'local' as AppDeployEnv,
};
