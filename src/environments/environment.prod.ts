import {
  runtimeApiUrl,
  runtimeAppEnv,
  runtimeShowDemos,
  type AppDeployEnv,
} from './environment.runtime';

export type { AppDeployEnv };

export const environment = {
  production: true,
  apiUrl: runtimeApiUrl,
  showDemoLogins: runtimeShowDemos,
  appEnv: runtimeAppEnv,
};
