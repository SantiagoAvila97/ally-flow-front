export const ESTADOS_CASO = [
  'PendienteAsignacion',
  'Asignado',
  'EnGestion',
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
  'EnGarantia',
  'CerradoGarantia',
] as const;

export type EstadoCaso = (typeof ESTADOS_CASO)[number];
export type TipoFirmaCierre = 'TECNICO' | 'ATENDIDO' | 'AMBAS';

export interface HistorialCambio {
  fecha: string;
  estado: EstadoCaso;
  usuarioId: string;
  usuarioNombre: string;
  nota?: string;
}

export interface LineaCobro {
  itemCostoId: string | null;
  nombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

export interface GastoMaterial {
  id: string;
  descripcion: string;
  monto: number;
  fotoUrl: string | null;
}

export const ESTADOS_OCULTOS_TECNICO: EstadoCaso[] = [
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
  'EnGarantia',
  'CerradoGarantia',
];

export const ESTADOS_GASTOS_OPERACION: EstadoCaso[] = [
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
];

export interface Caso {
  id: string;
  titulo: string;
  descripcion: string;
  cliente: string;
  estado: EstadoCaso;
  empresaId: string;
  asesorId: string;
  tecnicoId: string | null;
  numeroAseguradora: string;
  aseguradora: string;
  titularNombre: string;
  titularTelefono: string;
  direccion: string;
  ciudad: string;
  lat: number | null;
  lon: number | null;
  direccionNormalizada: string | null;
  categoriaServicio: string;
  observaciones: string;
  fotos: string[];
  firmaAtendidoUrl: string | null;
  firmaTecnicoUrl: string | null;
  gestionadoAt: string | null;
  esGarantia: boolean;
  casoOrigenId: string | null;
  montoEstimado: number | null;
  lineasCobro: LineaCobro[];
  documentoCobroGeneradoAt: string | null;
  pagoTecnico: number | null;
  gastosMateriales: GastoMaterial[];
  historialCambios: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearCasoPayload {
  titulo: string;
  descripcion?: string;
  numeroAseguradora: string;
  aseguradora: string;
  titularNombre: string;
  titularTelefono: string;
  direccion: string;
  ciudad: string;
  categoriaServicio: string;
  observaciones?: string;
  lat?: number | null;
  lon?: number | null;
  direccionNormalizada?: string;
}

export interface CompletarCasoPayload {
  tipoFirma: TipoFirmaCierre;
  firmaTecnicoUrl?: string;
  firmaAtendidoUrl?: string;
}

export interface TecnicoOption {
  id: string;
  nombre: string;
  email: string;
  role: string;
}
