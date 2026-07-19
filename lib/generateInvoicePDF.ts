import jsPDF from 'jspdf';

export function generateInvoicePDF(factura: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // Logo
  try {
    doc.addImage('/logo-bloquera.png', 'PNG', 15, 8, 30, 30);
  } catch (e) {}

  // Encabezado
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOQUERA TONKA', centerX, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Santa Bárbara, S.B. Honduras', centerX, 22, { align: 'center' });
  doc.text('Teléfono: 9359-8781', centerX, 27, { align: 'center' });

  // Línea azul
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1.2);
  doc.line(20, 38, pageWidth - 20, 38);

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', centerX, 48, { align: 'center' });

  // Datos
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const fecha = factura.fecha_despacho || factura.fecha || new Date().toLocaleDateString('es-HN');
  const numFactura = factura.num_factura || 'N/A';

  doc.text(`N° Factura: ${numFactura}`, 20, 58);
  doc.text(`Fecha: ${fecha}`, pageWidth - 20, 58, { align: 'right' });
  doc.text(`Cliente: ${factura.cliente || ''}`, 20, 65);

  if (factura.identidad) doc.text(`Identidad: ${factura.identidad}`, 20, 72);
  if (factura.rtn) doc.text(`RTN: ${factura.rtn}`, 20, 79);
  if (factura.direccion) doc.text(`Dirección: ${factura.direccion}`, 20, factura.rtn || factura.identidad ? 86 : 72);

  // Detalle
  const startY = (factura.direccion ? 86 : (factura.rtn || factura.identidad ? 79 : 72)) + 5;
  doc.setDrawColor(180);
  doc.line(20, startY, pageWidth - 20, startY);

  doc.setFontSize(11);
  doc.text('Producto', 20, startY + 8);
  doc.text('Cantidad', 80, startY + 8);
  doc.text('Precio Unit.', 115, startY + 8);
  doc.text('Total', 160, startY + 8);

  doc.line(20, startY + 10, pageWidth - 20, startY + 10);

  const y = startY + 18;

  // === PRECIO UNITARIO INTELIGENTE ===
  let precioUnitario = Number(factura.precio_unitario || factura.precio || 0);

  if (precioUnitario === 0 && factura.cantidad && factura.total_venta) {
    precioUnitario = Number(factura.total_venta) / Number(factura.cantidad);
  }

  doc.text(factura.producto || '', 20, y);
  doc.text(String(factura.cantidad || 0), 85, y);
  doc.text(`L. ${precioUnitario.toFixed(2)}`, 118, y);
  doc.text(`L. ${Number(factura.total_venta || factura.total || 0).toFixed(2)}`, 163, y);

  // === RESUMEN DE PAGO ===
  let currentY = y + 20;

  // Línea separadora
  doc.setDrawColor(180);
  doc.line(40, currentY - 5, pageWidth - 40, currentY - 5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const totalVenta = Number(factura.total_venta || factura.total || 0);
  const anticipo = Number(factura.anticipo) || 0;
  const saldoPendiente = Number(factura.saldo_pendiente) || 0;

  // Total a Pagar
  doc.text('Total a Pagar:', pageWidth - 80, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(`L. ${totalVenta.toFixed(2)}`, pageWidth - 30, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  currentY += 8;

  // Anticipo (si existe)
  if (anticipo > 0) {
    doc.setTextColor(16, 185, 129); // verde
    doc.text('Anticipo Recibido:', pageWidth - 80, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- L. ${anticipo.toFixed(2)}`, pageWidth - 30, currentY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    currentY += 8;
  }

  // Línea
  doc.setDrawColor(180);
  doc.line(pageWidth - 80, currentY - 2, pageWidth - 30, currentY - 2);
  currentY += 6;

  // Saldo o Estado
  if (saldoPendiente > 0) {
    doc.setTextColor(220, 38, 38); // rojo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALDO PENDIENTE:', pageWidth - 80, currentY);
    doc.text(`L. ${saldoPendiente.toFixed(2)}`, pageWidth - 30, currentY, { align: 'right' });
  } else {
    doc.setTextColor(16, 185, 129); // verde
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO: PAGADO', centerX, currentY, { align: 'center' });
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
  }

  currentY += 15;

  // Pie
  doc.setDrawColor(59, 130, 246);
  doc.line(20, 255, pageWidth - 20, 255);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('¡Gracias por su compra!', centerX, 265, { align: 'center' });
  doc.text('Bloquera Tonka • Santa Bárbara, S.B. • Tel: 9359-8781', centerX, 271, { align: 'center' });

  doc.save(`Factura_${numFactura}.pdf`);
}