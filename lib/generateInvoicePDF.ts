import jsPDF from 'jspdf';

// Paleta de marca (misma que la UI: tinta + oro envejecido sobre marfil).
// Nota: la plantilla es 100% fondo blanco a propósito — nada de rectángulos
// rellenos — para no gastar tinta al imprimir. El acento se logra solo con
// texto en color y líneas/contornos finos (0.3–0.6pt).
const INK: [number, number, number] = [21, 19, 15];
const GOLD: [number, number, number] = [153, 111, 39];
const LINE: [number, number, number] = [222, 216, 202];
const TEXT: [number, number, number] = [32, 28, 23];
const MUTED: [number, number, number] = [120, 112, 100];
const GREEN: [number, number, number] = [6, 95, 70];
const RED: [number, number, number] = [153, 27, 27];

export function generateInvoicePDF(factura: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;

  const numFactura = factura.num_factura || 'N/A';
  const fechaRaw = factura.fecha_despacho || factura.fecha;
  const fecha = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-HN') : new Date().toLocaleDateString('es-HN');

  let precioUnitario = Number(factura.precio_unitario || factura.precio || 0);
  if (precioUnitario === 0 && factura.cantidad && factura.total_venta) {
    precioUnitario = Number(factura.total_venta) / Number(factura.cantidad);
  }
  const totalVenta = Number(factura.total_venta || factura.total || 0);
  const anticipo = Number(factura.anticipo) || 0;
  const saldoPendiente = Number(factura.saldo_pendiente) || 0;

  // ============================================================
  // ENCABEZADO — logo, marca y N° de factura, sin bandas de color
  // ============================================================
  try {
    doc.addImage('/logo-bloquera.png', 'PNG', marginX, 10, 18, 18);
  } catch {
    // Si el logo no carga, el encabezado igual funciona sin él.
  }

  const textStartX = marginX + 23;
  doc.setFont('times', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  doc.text('BLOQUERA TONKA', textStartX, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('SISTEMA DE GESTIÓN INTEGRAL', textStartX, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('FACTURA', pageWidth - marginX, 15, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(`N.° ${numFactura}`, pageWidth - marginX, 23, { align: 'right' });

  let y = 34;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageWidth - marginX, y);

  // ============================================================
  // META — fecha de emisión / datos de contacto
  // ============================================================
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('FECHA DE EMISIÓN', marginX, y);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text(fecha, marginX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Santa Bárbara, S.B. · Honduras', pageWidth - marginX, y, { align: 'right' });
  doc.text('Tel. 9359-8781', pageWidth - marginX, y + 5, { align: 'right' });

  y += 16;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);

  // ============================================================
  // FACTURAR A — datos del cliente
  // ============================================================
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('FACTURAR A', marginX, y);

  y += 7;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT);
  doc.text(factura.cliente || 'Cliente sin nombre', marginX, y);

  if (factura.identidad || factura.rtn) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const partes = [
      factura.identidad ? `Identidad: ${factura.identidad}` : null,
      factura.rtn ? `RTN: ${factura.rtn}` : null,
    ].filter(Boolean);
    doc.text(partes.join('   ·   '), marginX, y);
  }
  if (factura.direccion) {
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(factura.direccion, marginX, y);
  }

  // ============================================================
  // DETALLE — tabla de productos (solo líneas, sin relleno)
  // ============================================================
  y += 13;
  const colProducto = marginX;
  const colCantidad = pageWidth - marginX - 78;
  const colPrecio = pageWidth - marginX - 45;
  const colTotal = pageWidth - marginX;

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('PRODUCTO', colProducto, y);
  doc.text('CANTIDAD', colCantidad, y, { align: 'right' });
  doc.text('PRECIO UNIT.', colPrecio, y, { align: 'right' });
  doc.text('TOTAL', colTotal, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 9;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(factura.producto || '', colProducto, y);
  doc.text(String(factura.cantidad || 0), colCantidad, y, { align: 'right' });
  doc.text(`L. ${precioUnitario.toFixed(2)}`, colPrecio, y, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.text(`L. ${totalVenta.toFixed(2)}`, colTotal, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);

  // ============================================================
  // RESUMEN DE PAGO — panel alineado a la derecha
  // ============================================================
  y += 12;
  const panelW = 78;
  const panelX = pageWidth - marginX - panelW;
  const labelX = panelX;
  const valueX = pageWidth - marginX;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Total a Pagar', labelX, y);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(`L. ${totalVenta.toFixed(2)}`, valueX, y, { align: 'right' });

  if (anticipo > 0) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text('Anticipo Recibido', labelX, y);
    doc.setFont('times', 'bold');
    doc.text(`- L. ${anticipo.toFixed(2)}`, valueX, y, { align: 'right' });
  }

  y += 5;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(labelX, y, valueX, y);
  y += 10;

  // Estado final, a modo de sello: solo contorno + texto en color,
  // nunca relleno sólido.
  if (saldoPendiente > 0) {
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.5);
    doc.rect(panelX, y - 6, panelW, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...RED);
    doc.text('SALDO PENDIENTE', labelX + 3, y + 1);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(`L. ${saldoPendiente.toFixed(2)}`, valueX - 3, y + 1, { align: 'right' });
  } else {
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.rect(panelX, y - 6, panelW, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GOLD);
    doc.text('PAGADO EN SU TOTALIDAD', panelX + panelW / 2, y + 1, { align: 'center' });
  }

  // ============================================================
  // PIE DE PÁGINA
  // ============================================================
  const footerY = 268;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(marginX + 55, footerY, pageWidth - marginX - 55, footerY);

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text('Gracias por su preferencia', pageWidth / 2, footerY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Bloquera Tonka  ·  Santa Bárbara, S.B., Honduras  ·  Tel. 9359-8781', pageWidth / 2, footerY + 14, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(190, 185, 175);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-HN')}`, pageWidth - marginX, 290, { align: 'right' });

  doc.save(`Factura_${numFactura}.pdf`);
}
