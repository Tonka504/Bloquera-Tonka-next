// Lógica de descuento compartida entre el servidor (app/actions.ts) y la UI
// (previsualización en los formularios, desglose en el PDF de factura).
//
// Modos soportados:
//   'ninguno'    -> sin descuento (por defecto; puede pasar a 'automatico' si se supera el umbral)
//   'no_aplica'  -> este pedido/factura NUNCA lleva descuento, ni siquiera el automático
//                   (a diferencia de 'ninguno', la sugerencia automática no lo sobreescribe)
//   'automatico' -> 10% si la cantidad de bloques es mayor a 500 (activable/desactivable por pedido/factura)
//   'porcentaje' -> % manual sobre el subtotal (usa "valor", 0-100)
//   'monto'      -> monto fijo en L. (usa "valor")
export type DescuentoTipo = 'ninguno' | 'no_aplica' | 'automatico' | 'porcentaje' | 'monto';

export const UMBRAL_DESCUENTO_AUTOMATICO = 500;
export const PORCENTAJE_DESCUENTO_AUTOMATICO = 10;

/** Calcula el monto de descuento (en L.), siempre acotado entre 0 y el subtotal. */
export function calcularDescuento(subtotal: number, cantidad: number, tipo: DescuentoTipo, valor: number): number {
  let monto = 0;
  if (tipo === 'automatico') {
    monto = cantidad > UMBRAL_DESCUENTO_AUTOMATICO ? subtotal * (PORCENTAJE_DESCUENTO_AUTOMATICO / 100) : 0;
  } else if (tipo === 'porcentaje') {
    monto = subtotal * (Math.max(0, Math.min(100, valor)) / 100);
  } else if (tipo === 'monto') {
    monto = Math.max(0, valor);
  }
  return Math.min(Math.max(monto, 0), subtotal || 0);
}

/**
 * Etiqueta legible del descuento aplicado, para mostrar en UI y en el PDF.
 * Corta a propósito (sin el detalle de "+500 bloques") para que quepa en
 * una sola línea junto al monto, incluso en columnas angostas / mobile.
 */
export function labelDescuento(tipo: DescuentoTipo, valor: number): string {
  switch (tipo) {
    case 'automatico':
      return `Descuento automático (${PORCENTAJE_DESCUENTO_AUTOMATICO}%)`;
    case 'porcentaje':
      return `Descuento (${valor}%)`;
    case 'monto':
      return 'Descuento';
    default:
      return '';
  }
}
