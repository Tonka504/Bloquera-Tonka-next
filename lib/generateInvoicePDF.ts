import jsPDF from 'jspdf';
import type { DescuentoTipo } from './descuento';

// Paleta de marca: tinta casi negra + oro, sobre fondo blanco/marfil.
// Inspirada en la plantilla de cotización con panel diagonal oscuro
// arriba a la derecha y tabla de detalle con encabezado en tinta.
const INK: [number, number, number] = [21, 19, 15];
const INK_SOFT: [number, number, number] = [34, 30, 24];
const GOLD: [number, number, number] = [182, 137, 63];
const GOLD_BRIGHT: [number, number, number] = [201, 156, 74];
const LINE: [number, number, number] = [222, 216, 202];
const TEXT: [number, number, number] = [32, 28, 23];
const MUTED: [number, number, number] = [120, 112, 100];
const WHITE: [number, number, number] = [255, 255, 255];
const GREEN: [number, number, number] = [6, 95, 70];
const RED: [number, number, number] = [153, 27, 27];

// ============================================================
// NÚMERO A LETRAS (para el total, en español / lempiras)
// ============================================================
const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const ESPECIALES = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function convertirDecenas(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return ESPECIALES[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 2) return u === 0 ? 'veinte' : `veinti${UNIDADES[u]}`;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function convertirCentenas(n: number): string {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return [c > 0 ? CENTENAS[c] : '', resto > 0 ? convertirDecenas(resto) : ''].filter(Boolean).join(' ');
}

function convertirMiles(n: number): string {
  if (n < 1000) return convertirCentenas(n);
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const parteMiles = miles === 1 ? 'mil' : `${convertirCentenas(miles)} mil`;
  return [parteMiles, resto > 0 ? convertirCentenas(resto) : ''].filter(Boolean).join(' ');
}

function convertirMillones(n: number): string {
  if (n < 1_000_000) return convertirMiles(n);
  const millones = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const parteMillones = millones === 1 ? 'un millón' : `${convertirMiles(millones)} millones`;
  return [parteMillones, resto > 0 ? convertirMiles(resto) : ''].filter(Boolean).join(' ');
}

function numeroALetras(monto: number): string {
  const entero = Math.floor(Math.max(0, monto));
  const centavos = Math.round((monto - entero) * 100);
  const letras = entero === 0 ? 'cero' : convertirMillones(entero);
  const capitalizado = letras.charAt(0).toUpperCase() + letras.slice(1);
  return centavos > 0
    ? `${capitalizado} lempiras con ${String(centavos).padStart(2, '0')}/100.`
    : `${capitalizado} lempiras exactos.`;
}

/** Formatea un monto en L. con separador de miles, ej. "L 12,600.00". */
function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================
// ICONOS — trazos simples (líneas/círculos), sin dependencias
// ============================================================
function drawCheck(doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + size * 0.35, y + size * 0.4);
  doc.line(x + size * 0.35, y + size * 0.4, x + size, y - size * 0.45);
}

function drawCalendarIcon(doc: jsPDF, x: number, y: number, w: number, h: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 0.5, 0.5, 'S');
  doc.line(x, y + h * 0.35, x + w, y + h * 0.35);
  doc.line(x + w * 0.28, y - 0.8, x + w * 0.28, y + 0.8);
  doc.line(x + w * 0.72, y - 0.8, x + w * 0.72, y + 0.8);
}

function drawPinIcon(doc: jsPDF, cx: number, cy: number, r: number, color: [number, number, number]) {
  doc.setFillColor(...color);
  doc.circle(cx, cy - r * 0.25, r, 'F');
  doc.triangle(cx - r * 0.55, cy, cx + r * 0.55, cy, cx, cy + r * 1.2, 'F');
}

function drawPhoneIcon(doc: jsPDF, cx: number, cy: number, s: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.roundedRect(cx - s * 0.35, cy - s * 0.6, s * 0.7, s * 1.2, 0.5, 0.5, 'S');
  doc.setFillColor(...color);
  doc.circle(cx, cy + s * 0.42, 0.35, 'F');
}

function drawMedalIcon(doc: jsPDF, cx: number, cy: number, r: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  doc.circle(cx, cy - r * 0.25, r, 'S');
  doc.circle(cx, cy - r * 0.25, r * 0.45, 'S');
  doc.line(cx - r * 0.5, cy + r * 0.45, cx - r * 0.15, cy + r * 1.5);
  doc.line(cx + r * 0.5, cy + r * 0.45, cx + r * 0.15, cy + r * 1.5);
}

function drawBox3DIcon(doc: jsPDF, cx: number, cy: number, s: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  const o = s * 0.32;
  doc.rect(cx - s / 2, cy - s / 2 + o, s, s, 'S');
  doc.lines([[s, 0], [o, -o], [-s, 0], [-o, o]], cx - s / 2, cy - s / 2 + o, [1, 1], 'S', true);
  doc.lines([[o, -o], [0, s], [-o, o], [0, -s]], cx + s / 2, cy - s / 2 + o, [1, 1], 'S', true);
}

function drawShieldIcon(doc: jsPDF, cx: number, cy: number, s: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.lines(
    [
      [s * 0.8, s * 0.28],
      [-s * 0.08, s * 0.95],
      [-s * 0.72, s * 0.5],
      [-s * 0.72, -s * 0.5],
      [-s * 0.08, -s * 0.95],
    ],
    cx,
    cy - s,
    [1, 1],
    'S',
    true
  );
}

export function generateInvoicePDF(factura: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentW = pageWidth - marginX * 2;
  const footerH = 20;
  const footerY = pageHeight - footerH;

  const numFactura = factura.num_factura;
  const esCotizacion = !numFactura;
  const tituloDoc = esCotizacion ? 'COTIZACIÓN' : 'FACTURA';

  const fechaRaw = factura.fecha_despacho || factura.fecha;
  const fechaDoc = fechaRaw ? new Date(fechaRaw) : new Date();
  const fecha = fechaDoc.toLocaleDateString('es-HN');
  const codigoFecha = `${fechaDoc.getFullYear()}-${String(fechaDoc.getMonth() + 1).padStart(2, '0')}-${String(fechaDoc.getDate()).padStart(2, '0')}`;
  // Las facturas ya despachadas tienen num_factura (correlativo real de la BD);
  // una cotización sin número asignado usa un código de referencia por fecha.
  const numeroDoc = numFactura || factura.id || `BT-${codigoFecha}`;

  let precioUnitario = Number(factura.precio_unitario || factura.precio || 0);
  if (precioUnitario === 0 && factura.cantidad && factura.total_venta) {
    precioUnitario = Number(factura.total_venta) / Number(factura.cantidad);
  }
  const totalVenta = Number(factura.total_venta || factura.total || 0);
  const anticipo = Number(factura.anticipo) || 0;
  const saldoPendiente = Number(factura.saldo_pendiente) || 0;
  const descuentoMonto = Number(factura.descuento_monto) || 0;
  const descuentoTipo: DescuentoTipo = factura.descuento_tipo || 'ninguno';
  const descuentoValor = Number(factura.descuento_valor) || 0;
  const subtotal = Number(factura.subtotal) || totalVenta + descuentoMonto;
  const cantidad = Number(factura.cantidad) || 0;

  const medidaMatch = String(factura.producto || '').match(/(\d+(?:\.\d+)?)/);
  const medida = medidaMatch ? `${medidaMatch[1]}"` : null;

  // ============================================================
  // ENCABEZADO — logo/marca a la izquierda, panel diagonal a la derecha
  // ============================================================
  const headerH = 50;
  const panelTopX = pageWidth * 0.56;
  const panelBottomX = pageWidth * 0.68;

  doc.setFillColor(...INK);
  doc.triangle(panelTopX, 0, pageWidth, 0, pageWidth, headerH, 'F');
  doc.triangle(panelTopX, 0, pageWidth, headerH, panelBottomX, headerH, 'F');

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.line(panelTopX, 0, panelBottomX, headerH);
  doc.setLineWidth(0.3);
  doc.line(panelTopX - 2, 0, panelBottomX - 2, headerH);

  try {
    doc.addImage('/logo-bloquera.png', 'PNG', marginX, 8, 17, 17);
  } catch {
    // Si el logo no carga, el encabezado igual funciona sin él.
  }

  const wordmarkX = marginX + 21;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text('BLOQUERA', wordmarkX, 17);
  doc.setFont('times', 'bold');
  doc.setFontSize(27);
  doc.setTextColor(...GOLD);
  doc.text('TONKA', wordmarkX, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text('—  CALIDAD QUE CONSTRUYE CONFIANZA  —', wordmarkX, 39);

  // Contenido dentro del panel oscuro (usar el borde inferior, más angosto,
  // como límite seguro para que el texto no se salga del panel)
  const panelX = panelBottomX + 5;
  const panelRight = pageWidth - 10;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.roundedRect(panelX, 6, 6, 6, 1, 1, 'S');
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text('L', panelX + 3, 10.3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...GOLD_BRIGHT);
  doc.text(tituloDoc, panelX + 9, 11);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.roundedRect(panelX, 16, panelRight - panelX, 7, 1, 1, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE);
  doc.text(`N.° ${numeroDoc}`, panelX + (panelRight - panelX) / 2, 20.7, { align: 'center' });

  drawCalendarIcon(doc, panelX, 27, 4, 4, GOLD);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text(fecha, panelX + 7, 30.3);

  drawPinIcon(doc, panelX + 2, 37, 1.6, GOLD);
  doc.setFontSize(8);
  doc.setTextColor(220, 216, 208);
  doc.text('Santa Bárbara, Honduras', panelX + 7, 37.8);

  let y = headerH + 8;

  // ============================================================
  // CLIENTE
  // ============================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...GOLD);
  doc.text('CLIENTE:', marginX, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(marginX, y + 1.5, marginX + 32, y + 1.5);

  y += 10;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT);
  doc.text(factura.cliente || 'Cliente General', marginX, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y + 2.5, pageWidth - marginX, y + 2.5);

  if (factura.identidad || factura.rtn) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const partes = [factura.identidad ? `Identidad: ${factura.identidad}` : null, factura.rtn ? `RTN: ${factura.rtn}` : null].filter(Boolean);
    doc.text(partes.join('   ·   '), marginX, y);
  }
  if (factura.direccion) {
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(factura.direccion, marginX, y);
  }

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.text('Por este medio nos permitimos presentarle', marginX, y);
  y += 5;
  doc.text(esCotizacion ? 'la siguiente cotización:' : 'la siguiente factura:', marginX, y);
  y += 3;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + 22, y);

  // ============================================================
  // TABLA DE DETALLE
  // ============================================================
  y += 9;
  const colDescW = contentW * 0.42;
  const colCantW = contentW * 0.19;
  const colPrecioW = contentW * 0.20;
  const x0 = marginX;
  const x1 = x0 + colDescW;
  const x2 = x1 + colCantW;
  const x3 = x2 + colPrecioW;
  const x4 = pageWidth - marginX;

  const hHead = 9;
  const rowH = 27;

  doc.setFillColor(...INK);
  doc.rect(x0, y, contentW, hHead, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('DESCRIPCIÓN', x0 + 3, y + hHead / 2 + 1.3);
  doc.text('CANTIDAD', (x1 + x2) / 2, y + hHead / 2 + 1.3, { align: 'center' });
  doc.text('PRECIO UNIT.', (x2 + x3) / 2, y + hHead / 2 + 1.3, { align: 'center' });
  doc.text('TOTAL', (x3 + x4) / 2, y + hHead / 2 + 1.3, { align: 'center' });

  const bodyY = y + hHead;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.rect(x0, y, contentW, hHead + rowH, 'S');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  [x1, x2, x3].forEach((xLine) => doc.line(xLine, y, xLine, bodyY + rowH));

  let ty = bodyY + 8;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text('BLOQUE DE CONCRETO', x0 + 4, ty);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...MUTED);
  if (medida) {
    ty += 5.3;
    doc.text(`Medida: ${medida}`, x0 + 4, ty);
  }
  ty += 5;
  doc.text('Resistencia y calidad garantizada.', x0 + 4, ty);
  ty += 4.6;
  doc.text('Ideal para todo tipo de construcción.', x0 + 4, ty);

  const midBody = bodyY + rowH / 2;
  doc.setFont('times', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...TEXT);
  doc.text(cantidad.toLocaleString(), (x1 + x2) / 2, midBody, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('BLOQUES', (x1 + x2) / 2, midBody + 6, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text(`L ${fmt(precioUnitario)}`, (x2 + x3) / 2, midBody + 1.5, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`L ${fmt(subtotal)}`, (x3 + x4) / 2, midBody + 1.5, { align: 'center' });

  y = bodyY + rowH + 7;

  // ============================================================
  // DESCUENTO + RESUMEN — bloque de descuento (si aplica) y totales
  // ============================================================
  const tieneDescuento = descuentoMonto > 0;
  const summaryW = tieneDescuento ? contentW * 0.54 : contentW * 0.46;
  const summaryX = x4 - summaryW;
  const calloutW = tieneDescuento ? contentW - summaryW - 8 : 0;

  let summaryRows = 2; // Subtotal + Total
  if (tieneDescuento) summaryRows += 1;
  if (anticipo > 0) summaryRows += 1;
  const rowHS = 6.5;
  const summaryH = summaryRows * rowHS;

  if (tieneDescuento) {
    const calloutH = Math.max(summaryH, 24);
    doc.setFillColor(...INK);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.roundedRect(x0, y, calloutW, calloutH, 2, 2, 'FD');

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.circle(x0 + 9, y + 9, 3.2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text('%', x0 + 9, y + 10.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('DESCUENTO', x0 + 15, y + 7.5);
    doc.text('APLICADO', x0 + 15, y + 11.5);

    const esPorcentaje = descuentoTipo === 'automatico' || descuentoTipo === 'porcentaje';
    const pct = descuentoTipo === 'automatico' ? 10 : descuentoValor;
    const valorGrande = esPorcentaje ? `${pct}%` : `L ${descuentoValor.toFixed(0)}`;
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...GOLD_BRIGHT);
    doc.text(valorGrande, x0 + calloutW / 2, y + calloutH - 6, { align: 'center' });
  }

  // Caja de resumen (Subtotal / Descuento / Anticipo / Total)
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(summaryX, y, summaryW, summaryH, 'S');

  let ry = y;
  const drawSummaryRow = (label: string, value: string, opts?: { bg?: [number, number, number]; textColor?: [number, number, number]; bold?: boolean }) => {
    if (opts?.bg) {
      doc.setFillColor(...opts.bg);
      doc.rect(summaryX, ry, summaryW, rowHS, 'F');
    }
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...(opts?.textColor || TEXT));
    doc.text(label, summaryX + 4, ry + rowHS / 2 + 1.5);
    doc.setFont('times', 'bold');
    doc.text(value, summaryX + summaryW - 4, ry + rowHS / 2 + 1.5, { align: 'right' });
    ry += rowHS;
  };

  drawSummaryRow('SUBTOTAL', `L ${fmt(subtotal)}`, { textColor: MUTED });
  if (tieneDescuento) {
    // Etiqueta corta aquí (el detalle — automático/%/monto — ya se ve en el recuadro de descuento).
    drawSummaryRow('DESCUENTO', `- L ${fmt(descuentoMonto)}`, { textColor: GOLD, bold: true });
  }
  drawSummaryRow(esCotizacion ? 'TOTAL' + (tieneDescuento ? ' CON DESCUENTO' : '') : 'TOTAL A PAGAR', `L ${fmt(totalVenta)}`, {
    bg: INK,
    textColor: WHITE,
    bold: true,
  });
  if (anticipo > 0) {
    drawSummaryRow('ANTICIPO RECIBIDO', `- L ${fmt(anticipo)}`, { textColor: GREEN, bold: true });
  }

  y += Math.max(summaryH, tieneDescuento ? 24 : 0) + 7;

  // Sello de estado (solo para facturas ya despachadas)
  if (!esCotizacion) {
    const badgeW = 70;
    if (saldoPendiente > 0) {
      doc.setDrawColor(...RED);
      doc.setLineWidth(0.5);
      doc.rect(x4 - badgeW, y - 6, badgeW, 11, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...RED);
      doc.text('SALDO PENDIENTE', x4 - badgeW + 3, y);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`L ${fmt(saldoPendiente)}`, x4 - 3, y, { align: 'right' });
    } else {
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.5);
      doc.rect(x4 - badgeW, y - 6, badgeW, 11, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...GOLD);
      doc.text('PAGADO EN SU TOTALIDAD', x4 - badgeW / 2, y, { align: 'center' });
    }
    y += 9;
  }

  // ============================================================
  // TOTAL EN LETRAS
  // ============================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('TOTAL EN LETRAS:', marginX, y);
  y += 5.5;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text(numeroALetras(totalVenta), marginX, y);
  y += 3;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);

  // ============================================================
  // CONDICIONES
  // ============================================================
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('CONDICIONES:', marginX, y);

  const fechaVencimiento = new Date(fechaDoc);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

  const condiciones = esCotizacion
    ? [
        `Precios válidos hasta el ${fechaVencimiento.toLocaleDateString('es-HN')}.`,
        'Pago al contado o transferencia.',
        'Entrega a convenir.',
        'Gracias por preferir Bloquera TONKA.',
      ]
    : [
        saldoPendiente > 0 ? 'Queda un saldo pendiente por cobrar.' : 'Pago recibido en su totalidad.',
        'Producto entregado conforme a lo acordado.',
        'Conserve este comprobante para cualquier reclamo.',
        'Gracias por preferir Bloquera TONKA.',
      ];

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  condiciones.forEach((linea) => {
    drawCheck(doc, marginX, y - 2, 3, GREEN);
    doc.text(linea, marginX + 6, y);
    y += 5;
  });

  // ============================================================
  // FIRMA — anclada a una distancia fija sobre el pie de página, para
  // que nunca choque con el contenido de arriba (condiciones) ni con
  // el sello "Generado el..." de abajo.
  // ============================================================
  const firmaX = pageWidth - marginX - 55;
  const firmaY = footerY - 34;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text('BLOQUERA TONKA', firmaX + 27.5, firmaY, { align: 'center' });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(firmaX, firmaY + 10, firmaX + 55, firmaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Atentamente,', firmaX + 27.5, firmaY + 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('Bloquera TONKA', firmaX + 27.5, firmaY + 20, { align: 'center' });

  drawPhoneIcon(doc, firmaX + 19, firmaY + 25.5, 3.4, GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.text('9359-8781', firmaX + 24, firmaY + 26.7);

  // ============================================================
  // PIE DE PÁGINA — franja oscura con 3 distintivos
  // ============================================================
  doc.setFillColor(...INK_SOFT);
  doc.rect(0, footerY, pageWidth, footerH, 'F');

  const footerItems: [(d: jsPDF, cx: number, cy: number) => void, string, string][] = [
    [(d, cx, cy) => drawShieldIcon(d, cx, cy, 3.2, GOLD), 'CALIDAD QUE', 'CONSTRUYE CONFIANZA'],
    [(d, cx, cy) => drawMedalIcon(d, cx, cy, 2.6, GOLD), 'BLOQUES RESISTENTES', 'CON ACABADOS DE CALIDAD'],
    [(d, cx, cy) => drawBox3DIcon(d, cx, cy, 4.5, GOLD), 'SOMOS TU', 'MEJOR OPCIÓN'],
  ];
  const colW = pageWidth / 3;
  footerItems.forEach(([drawIcon, l1, l2], i) => {
    const cx = colW * i + 16;
    const cy = footerY + footerH / 2 - 1;
    drawIcon(doc, cx, cy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.7);
    doc.setTextColor(...WHITE);
    doc.text(l1, cx + 7, cy - 1.5);
    doc.text(l2, cx + 7, cy + 3);
  });

  doc.save(`${esCotizacion ? 'Cotizacion' : 'Factura'}_${numeroDoc}.pdf`);
}
