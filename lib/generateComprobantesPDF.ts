import jsPDF from 'jspdf';
import type { AbonoPedido, EntregaPedido, PedidoSeguimiento } from '../app/actions';

// Misma línea visual que lib/generateInvoicePDF.ts: fondo blanco, sin
// rellenos (ahorro de tinta), acento solo con texto y líneas finas.
const INK: [number, number, number] = [21, 19, 15];
const GOLD: [number, number, number] = [153, 111, 39];
const LINE: [number, number, number] = [222, 216, 202];
const TEXT: [number, number, number] = [32, 28, 23];
const MUTED: [number, number, number] = [120, 112, 100];
const GREEN: [number, number, number] = [6, 95, 70];
const RED: [number, number, number] = [153, 27, 27];

const MARGIN_X = 18;

const dinero = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const entero = (n: number) => Number(n).toLocaleString('es-HN');
// 'YYYY-MM-DD' -> dd/mm/aaaa sin pasar por zona horaria (evita el corrimiento de un día).
const fechaCorta = (f: string) => {
  const [y, m, d] = (f || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : f;
};
const nombreBloque = (tipo: string) => tipo.replace('bloque_de_', 'Bloque de ');

function encabezado(doc: jsPDF, titulo: string, numero: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  try {
    doc.addImage('/logo-bloquera.png', 'PNG', MARGIN_X, 10, 18, 18);
  } catch {
    // Si el logo no carga, el encabezado igual funciona sin él.
  }
  const textX = MARGIN_X + 23;
  doc.setFont('times', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  doc.text('BLOQUERA TONKA', textX, 19);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('SISTEMA DE GESTIÓN INTEGRAL', textX, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(titulo, pageWidth - MARGIN_X, 15, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(numero, pageWidth - MARGIN_X, 23, { align: 'right' });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, 34, pageWidth - MARGIN_X, 34);
}

// Bloque etiqueta/valor; devuelve la nueva Y.
function campo(doc: jsPDF, etiqueta: string, valor: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(etiqueta.toUpperCase(), x, y);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text(valor, x, y + 6);
}

function filaResumen(
  doc: jsPDF,
  etiqueta: string,
  valor: string,
  y: number,
  color: [number, number, number] = TEXT
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const panelX = pageWidth - MARGIN_X - 90;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...(color === TEXT ? MUTED : color));
  doc.text(etiqueta, panelX, y);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(valor, pageWidth - MARGIN_X, y, { align: 'right' });
}

function sello(doc: jsPDF, texto: string, y: number, color: [number, number, number]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const panelW = 90;
  const panelX = pageWidth - MARGIN_X - panelW;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.rect(panelX, y - 6, panelW, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...color);
  doc.text(texto, panelX + panelW / 2, y + 1, { align: 'center' });
}

function firmas(doc: jsPDF, izquierda: string, derecha: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const y = 240;
  const w = 65;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, MARGIN_X + w, y);
  doc.line(pageWidth - MARGIN_X - w, y, pageWidth - MARGIN_X, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(izquierda, MARGIN_X + w / 2, y + 5, { align: 'center' });
  doc.text(derecha, pageWidth - MARGIN_X - w / 2, y + 5, { align: 'center' });
}

function pie(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerY = 268;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X + 55, footerY, pageWidth - MARGIN_X - 55, footerY);
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text('Gracias por su preferencia', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Bloquera Tonka  ·  Santa Bárbara, S.B., Honduras  ·  Tel. 9359-8781', pageWidth / 2, footerY + 14, {
    align: 'center',
  });
  doc.setFontSize(7);
  doc.setTextColor(190, 185, 175);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-HN')}`, pageWidth - MARGIN_X, 290, { align: 'right' });
}

function observaciones(doc: jsPDF, texto: string, y: number) {
  if (!texto) return y;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('OBSERVACIONES', MARGIN_X, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  const lineas = doc.splitTextToSize(texto, pageWidth - MARGIN_X * 2);
  doc.text(lineas, MARGIN_X, y + 6);
  return y + 6 + lineas.length * 5;
}

/**
 * Comprobante de una entrega parcial. `pedido` debe ser el estado actual del
 * pedido; el acumulado se calcula hasta esta entrega usando `entregas`.
 */
export function generateEntregaPDF(pedido: PedidoSeguimiento, entrega: EntregaPedido, entregas: EntregaPedido[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Acumulado hasta esta entrega (incluida), según el orden del historial.
  const idx = entregas.findIndex((e) => e.id === entrega.id);
  const hastaAqui = idx >= 0 ? entregas.slice(0, idx + 1) : [entrega];
  const acumulado = hastaAqui.reduce((s, e) => s + e.cantidad, 0);
  const pendienteTrasEntrega = Math.max(pedido.cantidad_total - acumulado, 0);

  encabezado(doc, 'COMPROBANTE DE ENTREGA', `N.° E-${entrega.id}`);

  let y = 44;
  campo(doc, 'Pedido', `#${pedido.id}`, MARGIN_X, y);
  campo(doc, 'Fecha de entrega', fechaCorta(entrega.fecha), MARGIN_X + 50, y);
  campo(doc, 'Entrega N.°', `${idx >= 0 ? idx + 1 : '-'} de ${entregas.length}`, MARGIN_X + 110, y);

  y += 16;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  y += 9;
  campo(doc, 'Cliente', pedido.cliente, MARGIN_X, y);

  // Tabla de la entrega
  y += 20;
  const colCant = pageWidth - MARGIN_X - 78;
  const colPrecio = pageWidth - MARGIN_X - 45;
  const colTotal = pageWidth - MARGIN_X;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('PRODUCTO', MARGIN_X, y);
  doc.text('CANTIDAD', colCant, y, { align: 'right' });
  doc.text('PRECIO UNIT.', colPrecio, y, { align: 'right' });
  doc.text('TOTAL', colTotal, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
  y += 9;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(nombreBloque(pedido.tipo_bloque), MARGIN_X, y);
  doc.text(entero(entrega.cantidad), colCant, y, { align: 'right' });
  doc.text(dinero(entrega.precio_unitario), colPrecio, y, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.text(dinero(entrega.total), colTotal, y, { align: 'right' });
  y += 6;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  // Avance del pedido
  y += 12;
  filaResumen(doc, 'Total solicitado', `${entero(pedido.cantidad_total)} und`, y);
  y += 7;
  filaResumen(doc, 'Entregado a la fecha', `${entero(acumulado)} und`, y, GREEN);
  y += 7;
  filaResumen(doc, 'Pendiente de entregar', `${entero(pendienteTrasEntrega)} und`, y, pendienteTrasEntrega > 0 ? RED : TEXT);
  y += 5;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - MARGIN_X - 90, y, pageWidth - MARGIN_X, y);
  y += 10;
  sello(doc, pendienteTrasEntrega > 0 ? 'ENTREGA PARCIAL' : 'PEDIDO ENTREGADO COMPLETO', y, pendienteTrasEntrega > 0 ? GOLD : GREEN);

  y += 18;
  observaciones(doc, entrega.observaciones, y);

  firmas(doc, 'Entregado por', 'Recibido conforme (cliente)');
  pie(doc);
  doc.save(`Entrega_E-${entrega.id}_Pedido_${pedido.id}.pdf`);
}

/**
 * Recibo de un abono. El saldo se calcula hasta este abono usando `abonos`.
 */
export function generateAbonoPDF(pedido: PedidoSeguimiento, abono: AbonoPedido, abonos: AbonoPedido[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const idx = abonos.findIndex((a) => a.id === abono.id);
  const hastaAqui = idx >= 0 ? abonos.slice(0, idx + 1) : [abono];
  const abonadoCentavos = hastaAqui.reduce((s, a) => s + Math.round(a.monto * 100), 0);
  const anteriorCentavos = abonadoCentavos - Math.round(abono.monto * 100);
  const saldoCentavos = Math.max(Math.round(pedido.total * 100) - abonadoCentavos, 0);

  encabezado(doc, 'RECIBO DE ABONO', `N.° R-${abono.id}`);

  let y = 44;
  campo(doc, 'Pedido', `#${pedido.id}`, MARGIN_X, y);
  campo(doc, 'Fecha del abono', fechaCorta(abono.fecha), MARGIN_X + 50, y);
  campo(doc, 'Método de pago', abono.metodo_pago, MARGIN_X + 110, y);

  y += 16;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  y += 9;
  campo(doc, 'Recibimos de', pedido.cliente, MARGIN_X, y);
  if (abono.comprobante) campo(doc, 'N.° comprobante', abono.comprobante, MARGIN_X + 110, y);

  // Monto recibido, destacado
  y += 22;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('CANTIDAD RECIBIDA', MARGIN_X, y);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(dinero(abono.monto), pageWidth - MARGIN_X, y + 1, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Abono al pedido #${pedido.id}: ${entero(pedido.cantidad_total)} und de ${nombreBloque(pedido.tipo_bloque)}`,
    MARGIN_X,
    y + 2
  );
  y += 8;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  // Estado de cuenta
  y += 12;
  filaResumen(doc, 'Total del pedido', dinero(pedido.total), y);
  y += 7;
  filaResumen(doc, 'Abonos anteriores', dinero(anteriorCentavos / 100), y);
  y += 7;
  filaResumen(doc, 'Este abono', dinero(abono.monto), y, GREEN);
  y += 5;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - MARGIN_X - 90, y, pageWidth - MARGIN_X, y);
  y += 7;
  filaResumen(doc, 'Total abonado', dinero(abonadoCentavos / 100), y);
  y += 10;
  if (saldoCentavos > 0) {
    sello(doc, `SALDO PENDIENTE  ${dinero(saldoCentavos / 100)}`, y, RED);
  } else {
    sello(doc, 'PEDIDO PAGADO EN SU TOTALIDAD', y, GOLD);
  }

  y += 18;
  observaciones(doc, abono.observaciones, y);

  firmas(doc, 'Recibido por', 'Cliente');
  pie(doc);
  doc.save(`Recibo_R-${abono.id}_Pedido_${pedido.id}.pdf`);
}
