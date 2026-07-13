import type { EstadoCaso } from './caso.model';

export type BalancePeriodo = '7d' | '30d' | '90d' | 'all';

export interface BalanceTotales {
  pendienteEnviarCobro: number;
  casosPendienteEnviarCobro: number;
  pendientePago: number;
  casosPendientePago: number;
  ingresosCobrados: number;
  casosCobrados: number;
  porCobrar: number;
  casosPorCobrar: number;
  casosEnOperacion: number;
  casosTotal: number;
}

export interface BalancePorDimension {
  nombre: string;
  casos: number;
  ingresoCobrado: number;
  pendienteEnviarCobro: number;
  pendientePago: number;
}

export interface BalanceCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  categoriaServicio: string;
  estado: EstadoCaso;
  ingreso: number;
  updatedAt: string;
}

export interface BalanceResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: BalanceTotales;
  porAseguradora: BalancePorDimension[];
  casosPendienteEnviar: BalanceCasoFila[];
  casosPendientePago: BalanceCasoFila[];
  cobradosRecientes: BalanceCasoFila[];
}
