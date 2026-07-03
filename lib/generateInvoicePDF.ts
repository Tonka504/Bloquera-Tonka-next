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

  const fecha = factura.fecha_despacho || factura.fecha || new Date().toLocaleDateString();
  const numFactura = factura.num_factura || 'N/A';

  doc.text(`N° Factura: ${numFactura}`, 20, 58);
  doc.text(`Fecha: ${fecha}`, pageWidth - 20, 58, { align: 'right' });
  doc.text(`Cliente: ${factura.cliente || ''}`, 20, 65);

  if (factura.identidad) doc.text(`Identidad: ${factura.identidad}`, 20, 72);
  if (factura.rtn) doc.text(`RTN: ${factura.rtn}`, 20, 79);

  // Detalle
  doc.setDrawColor(180);
  doc.line(20, 85, pageWidth - 20, 85);

  doc.setFontSize(11);
  doc.text('Producto', 20, 93);
  doc.text('Cantidad', 80, 93);
  doc.text('Precio Unit.', 115, 93);
  doc.text('Total', 160, 93);

  doc.line(20, 95, pageWidth - 20, 95);

  const y = 103;

  // === PRECIO UNITARIO INTELIGENTE ===
  let precioUnitario = Number(factura.precio_unitario || factura.precio || 0);

  if (precioUnitario === 0 && factura.cantidad && factura.total) {
    precioUnitario = Number(factura.total) / Number(factura.cantidad);
  }

  doc.text(factura.producto || '', 20, y);
  doc.text(String(factura.cantidad || 0), 85, y);
  doc.text(`L. ${precioUnitario.toFixed(2)}`, 118, y);
  doc.text(`L. ${Number(factura.total || factura.total_venta || 0).toFixed(2)}`, 163, y);

  // Total
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL A PAGAR: L. ${Number(factura.total || factura.total_venta || 0).toFixed(2)}`, centerX, y + 18, { align: 'center' });

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