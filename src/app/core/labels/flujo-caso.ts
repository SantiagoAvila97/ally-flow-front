import type { Caso, EstadoCaso } from '../models/caso.model';
import { labelEstadoCaso } from './estado-caso';

export interface FlujoPasoDef {
  /** Estado(s) que marcan este paso; el primero se usa solo como clave de UI. */
  estado: EstadoCaso;
  titulo: string;
}

/** Flujo comercial habitual (servicio → cobro). */
export const FLUJO_COMERCIAL: FlujoPasoDef[] = [
  { estado: 'PendienteAsignacion', titulo: 'Por asignar' },
  { estado: 'Asignado', titulo: 'Técnico asignado' },
  { estado: 'EnGestion', titulo: 'En visita' },
  { estado: 'PendienteDocumentoCobro', titulo: 'Por facturar' },
  { estado: 'PendienteConfirmacionAsegurado', titulo: 'Factura enviada' },
  { estado: 'PendienteRecepcionPago', titulo: 'Espera pago' },
  { estado: 'Cobrado', titulo: 'Pagada' },
];

/**
 * Mini-flujo mientras la garantía está abierta.
 * Al cerrar visita → vuelve a Pagada (flujo comercial, paso 7).
 */
export const FLUJO_GARANTIA: FlujoPasoDef[] = [
  { estado: 'EnGarantia', titulo: 'Reabierto' },
  { estado: 'EnGestion', titulo: 'En visita' },
];

export interface FlujoCasoVista {
  modo: 'comercial' | 'garantia';
  /** 1-based */
  paso: number;
  total: number;
  etiqueta: string;
  tituloPaso: string;
  siguiente: string | null;
  steps: FlujoPasoDef[];
}

function indexComercial(estado: EstadoCaso): number {
  if (estado === 'CerradoGarantia') {
    // Legacy: casos que quedaron “garantía cerrada” = económica Pagada
    return FLUJO_COMERCIAL.length - 1;
  }
  const i = FLUJO_COMERCIAL.findIndex((s) => s.estado === estado);
  return i >= 0 ? i : 0;
}

function indexGarantia(estado: EstadoCaso): number {
  if (estado === 'EnGestion') return 1;
  return 0; // EnGarantia, PendienteAsignacion, Asignado
}

/** Garantía activa (visita de garantía en curso). */
export function esGarantiaActiva(caso: Pick<Caso, 'estado' | 'esGarantia'>): boolean {
  if (caso.estado === 'CerradoGarantia') return false;
  if (caso.estado === 'Cobrado' && !caso.esGarantia) return false;
  if (caso.estado === 'EnGarantia') return true;
  return !!caso.esGarantia && caso.estado !== 'Cobrado';
}

export function flujoCaso(caso: Pick<Caso, 'estado' | 'esGarantia'>): FlujoCasoVista {
  if (esGarantiaActiva(caso)) {
    const steps = FLUJO_GARANTIA;
    const idx = indexGarantia(caso.estado);
    return {
      modo: 'garantia',
      paso: idx + 1,
      total: steps.length,
      etiqueta: `Paso ${idx + 1} de ${steps.length}`,
      tituloPaso: steps[idx]!.titulo,
      siguiente: idx < steps.length - 1 ? steps[idx + 1]!.titulo : 'Vuelve a Pagada',
      steps,
    };
  }

  const steps = FLUJO_COMERCIAL;
  const idx = indexComercial(caso.estado);
  const siguiente = idx < steps.length - 1 ? steps[idx + 1]!.titulo : null;
  return {
    modo: 'comercial',
    paso: idx + 1,
    total: steps.length,
    etiqueta: `Paso ${idx + 1} de ${steps.length}`,
    tituloPaso:
      caso.estado === 'CerradoGarantia' ? 'Pagada' : steps[idx]!.titulo,
    siguiente,
    steps,
  };
}

/** Texto compacto para listas: "3/7 En visita". */
export function flujoCasoCorto(caso: Pick<Caso, 'estado' | 'esGarantia'>): string {
  const f = flujoCaso(caso);
  return `${f.paso}/${f.total} ${f.tituloPaso}`;
}

export function labelEstadoConPaso(caso: Pick<Caso, 'estado' | 'esGarantia'>): string {
  return `${labelEstadoCaso(caso.estado)} · ${flujoCasoCorto(caso)}`;
}
