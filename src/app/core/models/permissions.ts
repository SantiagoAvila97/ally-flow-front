/** Mirror of backend Permission strings for typing. */
export type Permission =
  | `casos:${string}`
  | 'suite:empresas'
  | 'admin:tarifas'
  | 'admin:catalogos'
  | 'balance:ver'
  | 'tenant:acceso';
