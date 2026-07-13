export interface LoginDemoUser {
  role: string;
  email: string;
  password: string;
}

export interface LoginDemoEmpresa {
  nombre: string;
  users: LoginDemoUser[];
}
