export interface Aseguradora {
  id: string;
  nombre: string;
  nit: string | null;
  personaResponsable: string | null;
  contactoCobros: string | null;
  whatsapp: string | null;
  activa: boolean;
}

export interface CiudadCatalogo {
  id: string;
  nombre: string;
  area: string;
  activa: boolean;
}

export interface CatalogosPayload {
  aseguradoras: Aseguradora[];
  ciudades: CiudadCatalogo[];
  categoriasServicio: string[];
}
