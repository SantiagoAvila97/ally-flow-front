export interface CategoriaCosto {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCosto {
  id: string;
  empresaId: string;
  categoriaId: string;
  nombre: string;
  descripcion: string;
  costoInterno: number;
  precioSugerido: number;
  unidad: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriaConItems extends CategoriaCosto {
  items: ItemCosto[];
}

export interface CrearCategoriaPayload {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarCategoriaPayload {
  nombre?: string;
  descripcion?: string;
}

export interface CrearItemPayload {
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  costoInterno: number;
  precioSugerido: number;
  unidad?: string;
  activo?: boolean;
}

export interface ActualizarItemPayload {
  categoriaId?: string;
  nombre?: string;
  descripcion?: string;
  costoInterno?: number;
  precioSugerido?: number;
  unidad?: string;
  activo?: boolean;
}

export type TipoPlantillaPdf = 'tabla_operativa' | 'carta_siniestro';

export interface PlantillaPdfExtras {
  destinatario: string;
  codigoProveedor: string;
  notaAdicional: string;
}

export interface PlantillaPdfCobro {
  id: string;
  empresaId: string;
  /** null = plantilla general; string = vista con extras de esa aseguradora */
  aseguradoraId: string | null;
  razonSocial: string;
  nit: string;
  ciudad: string;
  telefono: string;
  email: string;
  colorAcento: string;
  textoHeader: string;
  textoFooter: string;
  tipoPlantilla: TipoPlantillaPdf;
  extras: PlantillaPdfExtras;
  updatedAt: string;
}

export interface ActualizarPlantillaPdfPayload {
  aseguradoraId?: string | null;
  razonSocial?: string;
  nit?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  colorAcento?: string;
  textoHeader?: string;
  textoFooter?: string;
  tipoPlantilla?: TipoPlantillaPdf;
  extras?: Partial<PlantillaPdfExtras>;
}
