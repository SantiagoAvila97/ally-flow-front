import type { EstadoCaso } from './caso.model';

export type BalancePeriodo = '7d' | '30d' | '90d' | 'month' | 'all' | 'custom';

export interface BalanceRango {
  periodo: BalancePeriodo;
  desde?: string | null;
  hasta?: string | null;
}

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
  pagoTecnicos: number;
  materiales: number;
  utilidadOperativa: number;
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

export interface BalanceOpsCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  tecnicoId: string | null;
  tecnicoNombre: string | null;
  estado: EstadoCaso;
  ingreso: number;
  pagoTecnico: number | null;
  materiales: number;
  utilidad: number | null;
  updatedAt: string;
}

export interface BalancePorTecnico {
  tecnicoId: string;
  tecnicoNombre: string;
  casos: number;
  aPagar: number;
  pendientesLiquidar: number;
}

export interface BalanceResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: BalanceTotales;
  porAseguradora: BalancePorDimension[];
  casosPendienteEnviar: BalanceCasoFila[];
  casosPendientePago: BalanceCasoFila[];
  cobradosRecientes: BalanceCasoFila[];
  casosOperacion: BalanceOpsCasoFila[];
  porTecnico: BalancePorTecnico[];
}

export interface BalanceTecnicoCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  estado: EstadoCaso;
  cerradoEn: string | null;
  pagoTecnico: number | null;
  updatedAt: string;
}

export interface BalanceTecnicoResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: {
    aPagar: number;
    casosConPago: number;
    casosPendientes: number;
    casos: number;
  };
  casos: BalanceTecnicoCasoFila[];
}
