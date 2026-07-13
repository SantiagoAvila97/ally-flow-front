import {
  runtimeApiUrl,
  type AppDeployEnv,
} from './environment.runtime';

export type { AppDeployEnv };

/** Production: sin demos; API Railway PROD. */
export const environment = {
  production: true,
  apiUrl: runtimeApiUrl,
  showDemoLogins: false,
  appEnv: 'prod' as AppDeployEnv,
};
