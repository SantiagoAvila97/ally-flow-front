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

export interface PlantillaPdfCobro {
  empresaId: string;
  razonSocial: string;
  nit: string;
  ciudad: string;
  telefono: string;
  email: string;
  colorAcento: string;
  textoHeader: string;
  textoFooter: string;
  tipoPlantilla: TipoPlantillaPdf;
  updatedAt: string;
}

export interface ActualizarPlantillaPdfPayload {
  razonSocial?: string;
  nit?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  colorAcento?: string;
  textoHeader?: string;
  textoFooter?: string;
  tipoPlantilla?: TipoPlantillaPdf;
}
