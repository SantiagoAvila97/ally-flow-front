import type { EstadoCaso } from '../models/caso.model';

/** Etiquetas de UI (el enum interno no cambia). */
export const LABEL_ESTADO_CASO: Record<EstadoCaso, string> = {
  PendienteAsignacion: 'Por asignar',
  Asignado: 'Técnico asignado',
  EnGestion: 'En visita',
  PendienteDocumentoCobro: 'Por facturar',
  PendienteConfirmacionAsegurado: 'Factura enviada · espera OK',
  PendienteRecepcionPago: 'Pendiente de pago',
  Cobrado: 'Pagada',
  EnGarantia: 'Pagada',
  CerradoGarantia: 'Pagada',
};

export function labelEstadoCaso(e: EstadoCaso): string {
  return LABEL_ESTADO_CASO[e] ?? e;
}
