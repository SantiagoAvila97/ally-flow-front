import {
  runtimeApiUrl,
  runtimeAppEnv,
  runtimeShowDemos,
  type AppDeployEnv,
} from './environment.runtime';

export type { AppDeployEnv };

export const environment = {
  production: false,
  apiUrl: runtimeApiUrl,
  showDemoLogins: runtimeShowDemos,
  appEnv: runtimeAppEnv,
};
