import { generateInvoicePDF } from './generateInvoicePDF';

const lps = (n: number) =>
  `L. ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Mensaje listo para el cliente. Recibe los mismos datos que generateInvoicePDF.
export function mensajeWhatsApp(datos: any): string {
  const esCotizacion = !datos.num_factura;
  const total = Number(datos.total_venta || datos.total || 0);
  const saldo = Number(datos.saldo_pendiente) || 0;
  const detalle = `${Number(datos.cantidad || 0).toLocaleString('es-HN')} ${datos.producto}`;

  const lineas = esCotizacion
    ? [
        `Estimado/a ${datos.cliente}, le saluda Bloquera Tonka.`,
        `Le compartimos su cotización por ${detalle}.`,
        `Total: ${lps(total)}`,
        '',
        'Quedamos atentos para confirmar su pedido.',
      ]
    : [
        `Estimado/a ${datos.cliente}, le saluda Bloquera Tonka.`,
        `Le compartimos su factura N.° ${datos.num_factura} por ${detalle}.`,
        `Total: ${lps(total)}`,
        ...(saldo > 0 ? [`Saldo pendiente: ${lps(saldo)}`] : []),
        '',
        '¡Gracias por su compra!',
      ];
  return lineas.join('\n');
}

// En el celular abre el menú de compartir con el PDF adjunto (se elige WhatsApp y el contacto).
// En la computadora descarga el PDF y abre WhatsApp con el mensaje listo para adjuntarlo.
// Devuelve 'compartido' | 'descargado' | 'cancelado'.
export async function compartirPorWhatsApp(datos: any): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const texto = mensajeWhatsApp(datos);
  const archivo = generateInvoicePDF(datos, { salida: 'archivo' });

  const esMovil = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (esMovil && archivo && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto });
      return 'compartido';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelado';
      // Si falla por otra razón, se sigue con descargar + abrir WhatsApp.
    }
  }

  if (archivo) {
    const url = URL.createObjectURL(archivo);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  return 'descargado';
}
