import {
  runtimeApiUrl,
  runtimeAppEnv,
  type AppDeployEnv,
} from './environment.runtime';

export type { AppDeployEnv };

/** Preview / QA: misma UX que LOCAL (demos ON). API vía generate-env → Railway QA. */
export const environment = {
  production: false,
  apiUrl: runtimeApiUrl,
  showDemoLogins: true,
  appEnv: (runtimeAppEnv === 'prod' ? 'qa' : runtimeAppEnv) as AppDeployEnv,
};
