'use server';

import { sql } from '../lib/db';
import { calcularDescuento, type DescuentoTipo } from '../lib/descuento';

// ============================================================
// TIPO UNIFICADO - Funciona sin narrowing complejo
// ============================================================
export type ServerResult<T = never> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type InventarioData = Record<string, number>;

export type Pedido = {
  id: number;
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  estado: string;
  estado_pago: string;
  anticipo: number;
  descuento_tipo: DescuentoTipo;
  descuento_valor: number;
};

export type Factura = {
  num_factura: number;
  fecha_despacho: string;
  cliente: string;
  producto: string;
  cantidad: number;
  subtotal: number;
  descuento_tipo: DescuentoTipo;
  descuento_valor: number;
  descuento_monto: number;
  total_venta: number;
  estado: string;
  anticipo: number;
  saldo_pendiente: number;
  identidad: string;
  rtn: string;
  direccion: string;
};

export type Gasto = {
  id: number;
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
};

export type HistorialItem = {
  id: number;
  tipo: string;
  cantidad: number;
  accion: string;
  fecha: string;
};

export type Configuracion = {
  bloques_por_bolsa: number;
  arena_por_100_bloques: number;
  precio_bloque_4: number;
  precio_bloque_5: number;
  precio_bloque_6: number;
};

export type DashboardResumen = {
  ventas: number;
  gastos: number;
  balance: number;
  por_cobrar: number;
  pedidosRecientes: Pedido[];
  ventasPorMes: { mes: string; total: number }[];
  stockBajo: { tipo: string; cantidad: number }[];
  facturasPendientes: { num_factura: number; cliente: string; saldo_pendiente: number; fecha_despacho: string }[];
};

export type ReporteGeneral = {
  totalVentas: number;
  totalGastos: number;
  ganancia: number;
  totalBloquesStock: number;
  totalFacturas: number;
  totalPedidosPendientes: number;
  ventasPorMes: { mes: string; total: number }[];
  gastosPorCategoria: { categoria: string; total: number }[];
  topClientes: { cliente: string; total: number }[];
};

// --- Seguimiento de pedidos (entregas parciales + abonos) ---
export type EstadoEntrega = 'Pendiente' | 'En proceso' | 'Entregado';
export type EstadoPagoSeguimiento = 'Pendiente' | 'Parcial' | 'Pagado';
export type EstadoPedidoSeguimiento = 'Pendiente' | 'En proceso' | 'Entregado' | 'Pagado' | 'Finalizado';
export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro';

export type PedidoSeguimiento = {
  id: number;
  cliente: string;
  fecha: string; // YYYY-MM-DD
  tipo_bloque: string; // misma clave que inventario.tipo, ej. 'bloque_de_4"'
  cantidad_total: number;
  precio_unitario: number;
  total: number;
  observaciones: string;
  // Calculados a partir del historial de entregas/abonos (nunca se guardan):
  cantidad_entregada: number;
  cantidad_pendiente: number;
  porcentaje_entrega: number;
  total_abonado: number;
  saldo_pendiente: number;
  estado_entrega: EstadoEntrega;
  estado_pago: EstadoPagoSeguimiento;
  estado: EstadoPedidoSeguimiento;
};

export type EntregaPedido = {
  id: number;
  pedido_id: number;
  fecha: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  observaciones: string;
};

export type AbonoPedido = {
  id: number;
  pedido_id: number;
  fecha: string;
  monto: number;
  metodo_pago: MetodoPago;
  comprobante: string;
  observaciones: string;
};

export type PedidoSeguimientoDetalle = {
  pedido: PedidoSeguimiento;
  entregas: EntregaPedido[];
  abonos: AbonoPedido[];
};

// ============================================================
// LOGIN
// ============================================================
export async function loginAction(
  username: string,
  password: string
): Promise<{ success: boolean; user?: { id: number; nombre: string; rol: string }; message?: string }> {
  try {
    const users = await sql`
      SELECT id, nombre, rol
      FROM usuarios
      WHERE username = ${username}
        AND password = ${password}
        AND activo = 1
      LIMIT 1
    `;

    if (users.length === 0) {
      return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    const user = users[0] as { id: number; nombre: string; rol: string };
    return { success: true, user };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al iniciar sesión' };
  }
}

// ============================================================
// DASHBOARD
// ============================================================
export async function getDashboardResumen(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ServerResult<DashboardResumen>> {
  let totalVentas = 0;
  let totalGastos = 0;
  let totalPorCobrar = 0;
  let pedidosRecientes: Pedido[] = [];
  let ventasPorMes: { mes: string; total: number }[] = [];
  let stockBajo: { tipo: string; cantidad: number }[] = [];
  let facturasPendientes: { num_factura: number; cliente: string; saldo_pendiente: number; fecha_despacho: string }[] = [];

  try {
    const ventasResult = await sql`
      SELECT COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha_despacho >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha_despacho <= ${fechaHasta}` : sql``}
    `;
    totalVentas = Number((ventasResult[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error ventas:', e);
  }

  try {
    const gastosResult = await sql`
      SELECT COALESCE(SUM(monto), 0) as total
      FROM gastos
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}` : sql``}
    `;
    totalGastos = Number((gastosResult[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error gastos:', e);
  }

  try {
    // "Por cobrar" es el saldo pendiente ACTUAL (no se acota por periodo):
    // representa deuda vigente, sin importar cuándo se generó la factura.
    const cobrarResult = await sql`SELECT COALESCE(SUM(saldo_pendiente), 0) as total FROM historial_facturas`;
    totalPorCobrar = Number((cobrarResult[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error por cobrar:', e);
  }

  try {
    pedidosRecientes = await sql`
      SELECT id, fecha, cliente, producto, cantidad, precio_unitario, estado, estado_pago, anticipo
      FROM pedidos
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}` : sql``}
      ORDER BY id DESC
      LIMIT 5
    ` as unknown as Pedido[];
  } catch (e) {
    console.log('Error pedidos recientes:', e);
  }

  try {
    ventasPorMes = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha_despacho::date), 'YYYY-MM-DD') as mes,
        COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE fecha_despacho >= (CURRENT_DATE - INTERVAL '5 months')
      GROUP BY DATE_TRUNC('month', fecha_despacho::date)
      ORDER BY mes ASC
    ` as unknown as { mes: string; total: number }[];
  } catch (e) {
    console.log('Error ventas por mes:', e);
  }

  try {
    stockBajo = await sql`
      SELECT tipo, cantidad
      FROM inventario
      WHERE tipo LIKE 'bloque_de_%' AND cantidad < 100
      ORDER BY cantidad ASC
    ` as unknown as { tipo: string; cantidad: number }[];
  } catch (e) {
    console.log('Error stock bajo:', e);
  }

  try {
    facturasPendientes = await sql`
      SELECT num_factura, cliente, saldo_pendiente, fecha_despacho
      FROM historial_facturas
      WHERE saldo_pendiente > 0
      ORDER BY fecha_despacho DESC
      LIMIT 5
    ` as unknown as { num_factura: number; cliente: string; saldo_pendiente: number; fecha_despacho: string }[];
  } catch (e) {
    console.log('Error facturas pendientes:', e);
  }

  return {
    success: true,
    data: {
      ventas: totalVentas,
      gastos: totalGastos,
      balance: totalVentas - totalGastos,
      por_cobrar: totalPorCobrar,
      pedidosRecientes: pedidosRecientes || [],
      ventasPorMes: ventasPorMes || [],
      stockBajo: stockBajo || [],
      facturasPendientes: facturasPendientes || [],
    },
  };
}

// ============================================================
// PEDIDOS
// ============================================================
export async function getPedidos(): Promise<ServerResult<Pedido[]>> {
  try {
    const data = await sql`SELECT * FROM pedidos ORDER BY id DESC`;
    return { success: true, data: data as unknown as Pedido[] };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar pedidos' };
  }
}

export async function crearPedidoAction(pedido: {
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  estado: string;
  estado_pago: string;
  anticipo: number;
  descuento_tipo?: DescuentoTipo;
  descuento_valor?: number;
}): Promise<ServerResult> {
  try {
    const descuentoTipo = pedido.descuento_tipo || 'ninguno';
    const descuentoValor = pedido.descuento_valor || 0;

    await sql`
      INSERT INTO pedidos (fecha, cliente, producto, cantidad, precio_unitario, estado, estado_pago, anticipo, descuento_tipo, descuento_valor)
      VALUES (${pedido.fecha}, ${pedido.cliente}, ${pedido.producto},
              ${pedido.cantidad}, ${pedido.precio_unitario}, ${pedido.estado}, ${pedido.estado_pago}, ${pedido.anticipo},
              ${descuentoTipo}, ${descuentoValor})
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al crear pedido' };
  }
}

export async function eliminarPedidoAction(id: number): Promise<ServerResult> {
  try {
    await sql`DELETE FROM pedidos WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al eliminar pedido' };
  }
}

export async function despacharPedidoAction(
  id: number,
  datosFactura?: {
    fecha_despacho?: string;
    identidad?: string;
    rtn?: string;
    direccion?: string;
    estado_pago?: string;
    descuento_tipo?: DescuentoTipo;
    descuento_valor?: number;
  }
): Promise<ServerResult> {
  try {
    const pedidos = await sql`SELECT * FROM pedidos WHERE id = ${id} LIMIT 1`;
    if (pedidos.length === 0) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    const pedido = pedidos[0] as any;
    const subtotal = Number(pedido.cantidad) * Number(pedido.precio_unitario);
    const anticipo = Number(pedido.anticipo) || 0;

    // El descuento se puede reconfirmar/ajustar al momento del despacho;
    // si no se manda nada, se respeta el que traía el pedido.
    const descuentoTipo: DescuentoTipo = datosFactura?.descuento_tipo || pedido.descuento_tipo || 'ninguno';
    const descuentoValor = datosFactura?.descuento_valor ?? Number(pedido.descuento_valor) ?? 0;
    const descuentoMonto = calcularDescuento(subtotal, Number(pedido.cantidad), descuentoTipo, descuentoValor);
    const total = subtotal - descuentoMonto;

    const estadoPago = 'Pagado';
    const saldoPendiente = 0;

    await sql`
      INSERT INTO historial_facturas
        (fecha_despacho, cliente, producto, cantidad, subtotal, descuento_tipo, descuento_valor, descuento_monto,
         total_venta, estado, anticipo, saldo_pendiente, identidad, rtn, direccion)
      VALUES (
        ${datosFactura?.fecha_despacho || new Date().toISOString().split('T')[0]},
        ${pedido.cliente},
        ${pedido.producto},
        ${pedido.cantidad},
        ${subtotal},
        ${descuentoTipo},
        ${descuentoValor},
        ${descuentoMonto},
        ${total},
        ${estadoPago},
        ${anticipo},
        ${saldoPendiente},
        ${datosFactura?.identidad || ''},
        ${datosFactura?.rtn || ''},
        ${datosFactura?.direccion || 'SANTA BARBARA, S.B., HONDURAS'}
      )
    `;

    const producto = String(pedido.producto).toLowerCase();

    if (producto.includes('4')) {
      await sql`
        UPDATE inventario
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0)
        WHERE tipo = 'bloque_de_4"'
      `;
    } else if (producto.includes('5')) {
      await sql`
        UPDATE inventario
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0)
        WHERE tipo = 'bloque_de_5"'
      `;
    } else if (producto.includes('6')) {
      await sql`
        UPDATE inventario
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0)
        WHERE tipo = 'bloque_de_6"'
      `;
    }

    await sql`DELETE FROM pedidos WHERE id = ${id}`;

    return { success: true };
  } catch (error) {
    console.error('Error en despacharPedidoAction:', error);
    return { success: false, message: 'Error al despachar el pedido' };
  }
}

// ============================================================
// GASTOS
// ============================================================
export async function getGastos(fechaDesde?: string, fechaHasta?: string): Promise<ServerResult<Gasto[]>> {
  try {
    const data = await sql`
      SELECT * FROM gastos
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}` : sql``}
      ORDER BY id DESC
    `;
    return { success: true, data: data as unknown as Gasto[] };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar gastos' };
  }
}

export async function crearGastoAction(gasto: {
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
}): Promise<ServerResult> {
  try {
    await sql`
      INSERT INTO gastos (fecha, descripcion, categoria, monto)
      VALUES (${gasto.fecha}, ${gasto.descripcion}, ${gasto.categoria}, ${gasto.monto})
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al registrar gasto' };
  }
}

export async function eliminarGastoAction(id: number): Promise<ServerResult> {
  try {
    await sql`DELETE FROM gastos WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al eliminar gasto' };
  }
}

// ============================================================
// INVENTARIO
// ============================================================
export async function getInventario(): Promise<ServerResult<InventarioData>> {
  try {
    const data = await sql`SELECT tipo, cantidad FROM inventario`;
    const inventario: Record<string, number> = {};
    (data as any[]).forEach((row: any) => {
      inventario[row.tipo] = Number(row.cantidad);
    });
    return { success: true, data: inventario };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar inventario' };
  }
}

export async function getHistorialInventario(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ServerResult<HistorialItem[]>> {
  try {
    const data = await sql`
      SELECT * FROM historial_inventario
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}::date + INTERVAL '1 day'` : sql``}
      ORDER BY fecha DESC, id DESC
      LIMIT 200
    `;
    return { success: true, data: data as unknown as HistorialItem[] };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar historial' };
  }
}

export async function abastecerInventarioAction(
  cemento: number,
  arena: number
): Promise<ServerResult> {
  try {
    if (cemento > 0) {
      await sql`
        UPDATE inventario
        SET cantidad = cantidad + ${cemento}
        WHERE tipo = 'cemento_bolsas'
      `;
      await sql`
        INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
        VALUES ('cemento_bolsas', ${cemento}, 'abastecimiento', NOW())
      `;
    }
    if (arena > 0) {
      await sql`
        UPDATE inventario
        SET cantidad = cantidad + ${arena}
        WHERE tipo = 'arena_m3'
      `;
      await sql`
        INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
        VALUES ('arena_m3', ${arena}, 'abastecimiento', NOW())
      `;
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al abastecer inventario' };
  }
}

// ============================================================
// PRODUCCION MANUAL
// ============================================================
export async function producirBloquesAction(params: {
  producto: string;
  cantidad: number;
  cemento_gastado: number;
  arena_gastada: number;
}): Promise<ServerResult> {
  try {
    const { producto, cantidad, cemento_gastado, arena_gastada } = params;

    if (cantidad <= 0) {
      return { success: false, message: 'La cantidad de bloques debe ser mayor a 0' };
    }
    if (cemento_gastado <= 0) {
      return { success: false, message: 'La cantidad de cemento gastado debe ser mayor a 0' };
    }
    if (arena_gastada <= 0) {
      return { success: false, message: 'La cantidad de arena gastada debe ser mayor a 0' };
    }

    const inventario = await sql`SELECT tipo, cantidad FROM inventario`;
    const stock: Record<string, number> = {};
    (inventario as any[]).forEach((row: any) => {
      stock[row.tipo] = Number(row.cantidad);
    });

    const cementoActual = stock['cemento_bolsas'] || 0;
    const arenaActual = stock['arena_m3'] || 0;

    if (cementoActual < cemento_gastado) {
      return {
        success: false,
        message: `No hay suficiente cemento. Necesitas ${cemento_gastado} bolsas y tienes ${cementoActual}`,
      };
    }

    if (arenaActual < arena_gastada) {
      return {
        success: false,
        message: `No hay suficiente arena. Necesitas ${arena_gastada.toFixed(2)} m³ y tienes ${arenaActual.toFixed(2)}`,
      };
    }

    await sql`
      UPDATE inventario
      SET cantidad = cantidad - ${cemento_gastado}
      WHERE tipo = 'cemento_bolsas'
    `;
    await sql`
      INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
      VALUES ('cemento_bolsas', ${cemento_gastado}, 'produccion_uso', NOW())
    `;

    await sql`
      UPDATE inventario
      SET cantidad = cantidad - ${arena_gastada}
      WHERE tipo = 'arena_m3'
    `;
    await sql`
      INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
      VALUES ('arena_m3', ${arena_gastada}, 'produccion_uso', NOW())
    `;

    await sql`
      UPDATE inventario
      SET cantidad = cantidad + ${cantidad}
      WHERE tipo = ${producto}
    `;
    await sql`
      INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
      VALUES (${producto}, ${cantidad}, 'produccion', NOW())
    `;

    return {
      success: true,
      message: `Producción exitosa. Se produjeron ${cantidad} bloques, usando ${cemento_gastado} bolsas de cemento y ${arena_gastada.toFixed(2)} m³ de arena.`,
    };
  } catch (error) {
    console.error('Error en producirBloquesAction:', error);
    return { success: false, message: 'Error en la producción' };
  }
}

// ============================================================
// FACTURAS
// ============================================================
export async function getFacturas(): Promise<ServerResult<Factura[]>> {
  try {
    const data = await sql`
      SELECT
        num_factura, fecha_despacho, cliente, producto, cantidad,
        subtotal, descuento_tipo, descuento_valor, descuento_monto,
        total_venta, estado, anticipo, saldo_pendiente,
        identidad, rtn, direccion
      FROM historial_facturas
      ORDER BY num_factura DESC
    `;
    return { success: true, data: data as unknown as Factura[] };
  } catch (error) {
    console.error('Error en getFacturas:', error);
    return { success: false, message: 'Error al cargar facturas' };
  }
}

export async function getFacturasFiltradas(filtros: {
  cliente?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}): Promise<ServerResult<Factura[]>> {
  try {
    let query = sql`
      SELECT
        num_factura, fecha_despacho, cliente, producto, cantidad,
        subtotal, descuento_tipo, descuento_valor, descuento_monto,
        total_venta, estado, anticipo, saldo_pendiente,
        identidad, rtn, direccion
      FROM historial_facturas
      WHERE 1=1
    `;

    if (filtros.cliente) {
      query = sql`${query} AND cliente ILIKE ${'%' + filtros.cliente + '%'}`;
    }
    if (filtros.fechaDesde) {
      query = sql`${query} AND fecha_despacho >= ${filtros.fechaDesde}`;
    }
    if (filtros.fechaHasta) {
      query = sql`${query} AND fecha_despacho <= ${filtros.fechaHasta}`;
    }
    if (filtros.estado) {
      query = sql`${query} AND estado = ${filtros.estado}`;
    }

    query = sql`${query} ORDER BY num_factura DESC`;

    const data = await query;
    return { success: true, data: data as unknown as Factura[] };
  } catch (error) {
    console.error('Error en getFacturasFiltradas:', error);
    return { success: false, message: 'Error al filtrar facturas' };
  }
}

export async function actualizarEstadoFactura(
  numFactura: number,
  nuevoEstado: string
): Promise<ServerResult> {
  try {
    await sql`
      UPDATE historial_facturas
      SET estado = ${nuevoEstado}
      WHERE num_factura = ${numFactura}
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al actualizar factura' };
  }
}

// ============================================================
// REPORTES
// ============================================================
export async function getReporteGeneral(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ServerResult<ReporteGeneral>> {
  let totalVentas = 0;
  let totalGastos = 0;
  let totalBloquesStock = 0;
  let totalFacturas = 0;
  let totalPedidosPendientes = 0;
  let ventasPorMes: { mes: string; total: number }[] = [];
  let gastosPorCategoria: { categoria: string; total: number }[] = [];
  let topClientes: { cliente: string; total: number }[] = [];

  try {
    const ventas = await sql`
      SELECT COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha_despacho >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha_despacho <= ${fechaHasta}` : sql``}
    `;
    totalVentas = Number((ventas[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error ventas reporte:', e);
  }

  try {
    const gastos = await sql`
      SELECT COALESCE(SUM(monto), 0) as total
      FROM gastos
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}` : sql``}
    `;
    totalGastos = Number((gastos[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error gastos reporte:', e);
  }

  try {
    const bloques = await sql`
      SELECT SUM(cantidad) as total
      FROM inventario
      WHERE tipo LIKE 'bloque_de_%'
    `;
    totalBloquesStock = Number((bloques[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error bloques reporte:', e);
  }

  try {
    const facturas = await sql`
      SELECT COUNT(*) as total
      FROM historial_facturas
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha_despacho >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha_despacho <= ${fechaHasta}` : sql``}
    `;
    totalFacturas = Number((facturas[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error facturas reporte:', e);
  }

  try {
    const pedidosPendientes = await sql`SELECT COUNT(*) as total FROM pedidos WHERE estado = 'Pendiente'`;
    totalPedidosPendientes = Number((pedidosPendientes[0] as any)?.total || 0);
  } catch (e) {
    console.log('Error pedidos reporte:', e);
  }

  try {
    ventasPorMes = await sql`
      SELECT
        SUBSTRING(fecha_despacho::text, 1, 7) as mes,
        COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha_despacho >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha_despacho <= ${fechaHasta}` : sql``}
      GROUP BY SUBSTRING(fecha_despacho::text, 1, 7)
      ORDER BY mes ASC
    ` as unknown as { mes: string; total: number }[];
  } catch (e) {
    console.log('Error ventas por mes reporte:', e);
  }

  try {
    gastosPorCategoria = await sql`
      SELECT categoria, COALESCE(SUM(monto), 0) as total
      FROM gastos
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha <= ${fechaHasta}` : sql``}
      GROUP BY categoria
      ORDER BY total DESC
    ` as unknown as { categoria: string; total: number }[];
  } catch (e) {
    console.log('Error gastos categoria reporte:', e);
  }

  try {
    topClientes = await sql`
      SELECT cliente, COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE 1=1
        ${fechaDesde ? sql`AND fecha_despacho >= ${fechaDesde}` : sql``}
        ${fechaHasta ? sql`AND fecha_despacho <= ${fechaHasta}` : sql``}
      GROUP BY cliente
      ORDER BY total DESC
      LIMIT 5
    ` as unknown as { cliente: string; total: number }[];
  } catch (e) {
    console.log('Error top clientes reporte:', e);
  }

  return {
    success: true,
    data: {
      totalVentas,
      totalGastos,
      ganancia: totalVentas - totalGastos,
      totalBloquesStock,
      totalFacturas,
      totalPedidosPendientes,
      ventasPorMes: ventasPorMes || [],
      gastosPorCategoria: gastosPorCategoria || [],
      topClientes: topClientes || [],
    },
  };
}

// ============================================================
// CONFIGURACION
// ============================================================
export async function getConfiguracion(): Promise<ServerResult<Configuracion>> {
  try {
    const data = await sql`SELECT * FROM configuracion LIMIT 1`;
    if (data.length === 0) {
      return { success: false, message: 'No hay configuración' };
    }
    return { success: true, data: data[0] as unknown as Configuracion };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar configuración' };
  }
}

export async function guardarConfiguracion(config: {
  bloques_por_bolsa: number;
  arena_por_100_bloques: number;
  precio_bloque_4: number;
  precio_bloque_5: number;
  precio_bloque_6: number;
}): Promise<ServerResult> {
  try {
    await sql`
      UPDATE configuracion
      SET
        bloques_por_bolsa = ${config.bloques_por_bolsa},
        arena_por_100_bloques = ${config.arena_por_100_bloques},
        precio_bloque_4 = ${config.precio_bloque_4},
        precio_bloque_5 = ${config.precio_bloque_5},
        precio_bloque_6 = ${config.precio_bloque_6}
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al guardar configuración' };
  }
}

// ============================================================
// SEGUIMIENTO DE PEDIDOS (entregas parciales + abonos)
// ============================================================
// Módulo independiente del flujo pedidos -> despacho -> facturas.
// Tablas: pedidos_seguimiento, entregas_pedido, abonos_pedido
// (ver sql/2026-11-11_seguimiento_pedidos.sql).
// Entregas y abonos son historial de solo inserción: nunca se editan ni borran.
// Cantidades, saldos y estados se calculan siempre desde ese historial.

const TIPOS_BLOQUE = ['bloque_de_4"', 'bloque_de_5"', 'bloque_de_6"'];
const METODOS_PAGO: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];

// Error de validación con mensaje para el usuario (se lanza dentro de transacciones).
class ErrorSeguimiento extends Error {}

// Dinero en centavos para evitar errores de redondeo de punto flotante.
const aCentavos = (n: number | string) => Math.round(Number(n) * 100);

function esFechaValida(fecha: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

function calcularPedidoSeguimiento(row: any): PedidoSeguimiento {
  const cantidad_total = Number(row.cantidad_total);
  const cantidad_entregada = Number(row.cantidad_entregada || 0);
  const total = Number(row.total);
  const total_abonado = Number(row.total_abonado || 0);

  const cantidad_pendiente = Math.max(cantidad_total - cantidad_entregada, 0);
  const saldoCentavos = Math.max(aCentavos(total) - aCentavos(total_abonado), 0);
  const porcentaje_entrega =
    cantidad_total > 0 ? Math.min(Math.round((cantidad_entregada / cantidad_total) * 1000) / 10, 100) : 0;

  const entregado = cantidad_pendiente === 0;
  const pagado = saldoCentavos === 0;

  const estado_entrega: EstadoEntrega =
    cantidad_entregada === 0 ? 'Pendiente' : entregado ? 'Entregado' : 'En proceso';
  const estado_pago: EstadoPagoSeguimiento =
    total_abonado <= 0 ? 'Pendiente' : pagado ? 'Pagado' : 'Parcial';

  let estado: EstadoPedidoSeguimiento;
  if (entregado && pagado) estado = 'Finalizado';
  else if (pagado) estado = 'Pagado';
  else if (entregado) estado = 'Entregado';
  else if (cantidad_entregada > 0) estado = 'En proceso';
  else estado = 'Pendiente';

  return {
    id: Number(row.id),
    cliente: row.cliente,
    fecha: row.fecha,
    tipo_bloque: row.tipo_bloque,
    cantidad_total,
    precio_unitario: Number(row.precio_unitario),
    total,
    observaciones: row.observaciones || '',
    cantidad_entregada,
    cantidad_pendiente,
    porcentaje_entrega,
    total_abonado,
    saldo_pendiente: saldoCentavos / 100,
    estado_entrega,
    estado_pago,
    estado,
  };
}

export async function getPedidosSeguimiento(): Promise<ServerResult<PedidoSeguimiento[]>> {
  try {
    const rows = await sql`
      SELECT
        p.id, p.cliente, TO_CHAR(p.fecha, 'YYYY-MM-DD') AS fecha, p.tipo_bloque,
        p.cantidad_total, p.precio_unitario, p.total, p.observaciones,
        COALESCE(e.entregado, 0) AS cantidad_entregada,
        COALESCE(a.abonado, 0) AS total_abonado
      FROM pedidos_seguimiento p
      LEFT JOIN (
        SELECT pedido_id, SUM(cantidad) AS entregado FROM entregas_pedido GROUP BY pedido_id
      ) e ON e.pedido_id = p.id
      LEFT JOIN (
        SELECT pedido_id, SUM(monto) AS abonado FROM abonos_pedido GROUP BY pedido_id
      ) a ON a.pedido_id = p.id
      ORDER BY p.id DESC
    `;
    return { success: true, data: (rows as any[]).map(calcularPedidoSeguimiento) };
  } catch (error) {
    console.error('Error en getPedidosSeguimiento:', error);
    return { success: false, message: 'Error al cargar los pedidos' };
  }
}

export async function getPedidoSeguimientoDetalle(
  id: number
): Promise<ServerResult<PedidoSeguimientoDetalle>> {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      return { success: false, message: 'Número de pedido inválido' };
    }

    const rows = await sql`
      SELECT
        p.id, p.cliente, TO_CHAR(p.fecha, 'YYYY-MM-DD') AS fecha, p.tipo_bloque,
        p.cantidad_total, p.precio_unitario, p.total, p.observaciones,
        (SELECT COALESCE(SUM(cantidad), 0) FROM entregas_pedido WHERE pedido_id = p.id) AS cantidad_entregada,
        (SELECT COALESCE(SUM(monto), 0) FROM abonos_pedido WHERE pedido_id = p.id) AS total_abonado
      FROM pedidos_seguimiento p
      WHERE p.id = ${id}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    const entregas = await sql`
      SELECT id, pedido_id, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, cantidad,
             precio_unitario, total, observaciones
      FROM entregas_pedido
      WHERE pedido_id = ${id}
      ORDER BY fecha ASC, id ASC
    `;
    const abonos = await sql`
      SELECT id, pedido_id, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, monto,
             metodo_pago, comprobante, observaciones
      FROM abonos_pedido
      WHERE pedido_id = ${id}
      ORDER BY fecha ASC, id ASC
    `;

    return {
      success: true,
      data: {
        pedido: calcularPedidoSeguimiento(rows[0]),
        entregas: (entregas as any[]).map((e) => ({
          id: Number(e.id),
          pedido_id: Number(e.pedido_id),
          fecha: e.fecha,
          cantidad: Number(e.cantidad),
          precio_unitario: Number(e.precio_unitario),
          total: Number(e.total),
          observaciones: e.observaciones || '',
        })),
        abonos: (abonos as any[]).map((a) => ({
          id: Number(a.id),
          pedido_id: Number(a.pedido_id),
          fecha: a.fecha,
          monto: Number(a.monto),
          metodo_pago: a.metodo_pago,
          comprobante: a.comprobante || '',
          observaciones: a.observaciones || '',
        })),
      },
    };
  } catch (error) {
    console.error('Error en getPedidoSeguimientoDetalle:', error);
    return { success: false, message: 'Error al cargar el pedido' };
  }
}

export async function crearPedidoSeguimientoAction(pedido: {
  cliente: string;
  fecha: string;
  tipo_bloque: string;
  cantidad_total: number;
  precio_unitario: number;
  observaciones?: string;
}): Promise<ServerResult<{ id: number }>> {
  try {
    const cliente = String(pedido.cliente || '').trim();
    const cantidad = Number(pedido.cantidad_total);
    const precio = Number(pedido.precio_unitario);

    if (!cliente) return { success: false, message: 'El nombre del cliente es obligatorio' };
    if (!esFechaValida(pedido.fecha)) return { success: false, message: 'La fecha del pedido no es válida' };
    if (!TIPOS_BLOQUE.includes(pedido.tipo_bloque)) return { success: false, message: 'Tipo de bloque inválido' };
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { success: false, message: 'La cantidad debe ser un número entero mayor a 0' };
    }
    if (!Number.isFinite(precio) || aCentavos(precio) <= 0) {
      return { success: false, message: 'El precio unitario debe ser mayor a 0' };
    }

    const precioCentavos = aCentavos(precio);
    const total = (precioCentavos * cantidad) / 100;

    const rows = await sql`
      INSERT INTO pedidos_seguimiento
        (cliente, fecha, tipo_bloque, cantidad_total, precio_unitario, total, observaciones)
      VALUES
        (${cliente}, ${pedido.fecha}, ${pedido.tipo_bloque}, ${cantidad},
         ${precioCentavos / 100}, ${total}, ${String(pedido.observaciones || '').trim()})
      RETURNING id
    `;
    return { success: true, data: { id: Number((rows[0] as any).id) } };
  } catch (error) {
    console.error('Error en crearPedidoSeguimientoAction:', error);
    return { success: false, message: 'Error al crear el pedido' };
  }
}

export async function registrarEntregaAction(entrega: {
  pedido_id: number;
  cantidad: number;
  fecha: string;
  observaciones?: string;
}): Promise<ServerResult<{ id: number }>> {
  const cantidad = Number(entrega.cantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { success: false, message: 'La cantidad entregada debe ser un número entero mayor a 0' };
  }
  if (!esFechaValida(entrega.fecha)) {
    return { success: false, message: 'La fecha de entrega no es válida' };
  }

  try {
    // Todo en una transacción: si algo falla no queda la entrega a medias
    // (entrega registrada sin descontar inventario, o al revés).
    const id = await sql.begin(async (tx: any) => {
      // FOR UPDATE bloquea el pedido para que dos entregas simultáneas
      // no puedan superar entre ambas la cantidad pendiente.
      const pedidos = await tx`
        SELECT id, tipo_bloque, cantidad_total, precio_unitario
        FROM pedidos_seguimiento
        WHERE id = ${entrega.pedido_id}
        FOR UPDATE
      `;
      if (pedidos.length === 0) throw new ErrorSeguimiento('Pedido no encontrado');
      const pedido = pedidos[0];

      const sumas = await tx`
        SELECT COALESCE(SUM(cantidad), 0) AS entregado
        FROM entregas_pedido
        WHERE pedido_id = ${entrega.pedido_id}
      `;
      const pendiente = Number(pedido.cantidad_total) - Number(sumas[0].entregado);
      if (pendiente <= 0) throw new ErrorSeguimiento('Este pedido ya fue entregado en su totalidad');
      if (cantidad > pendiente) {
        throw new ErrorSeguimiento(
          `No puedes entregar ${cantidad.toLocaleString()} bloques: solo quedan ${pendiente.toLocaleString()} pendientes`
        );
      }

      // La entrega saca bloques reales del inventario.
      const stock = await tx`
        SELECT cantidad FROM inventario WHERE tipo = ${pedido.tipo_bloque} FOR UPDATE
      `;
      const disponible = stock.length > 0 ? Number(stock[0].cantidad) : 0;
      if (disponible < cantidad) {
        throw new ErrorSeguimiento(
          `No hay suficiente inventario. Necesitas ${cantidad.toLocaleString()} bloques y hay ${disponible.toLocaleString()}`
        );
      }

      const precio = Number(pedido.precio_unitario);
      const total = (aCentavos(precio) * cantidad) / 100;

      const insert = await tx`
        INSERT INTO entregas_pedido (pedido_id, fecha, cantidad, precio_unitario, total, observaciones)
        VALUES (${entrega.pedido_id}, ${entrega.fecha}, ${cantidad}, ${precio}, ${total},
                ${String(entrega.observaciones || '').trim()})
        RETURNING id
      `;

      await tx`
        UPDATE inventario SET cantidad = cantidad - ${cantidad} WHERE tipo = ${pedido.tipo_bloque}
      `;
      await tx`
        INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
        VALUES (${pedido.tipo_bloque}, ${cantidad}, 'venta', NOW())
      `;

      return Number(insert[0].id);
    });

    return { success: true, data: { id: Number(id) } };
  } catch (error) {
    if (error instanceof ErrorSeguimiento) return { success: false, message: error.message };
    console.error('Error en registrarEntregaAction:', error);
    return { success: false, message: 'Error al registrar la entrega' };
  }
}

export async function registrarAbonoAction(abono: {
  pedido_id: number;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  comprobante?: string;
  observaciones?: string;
}): Promise<ServerResult<{ id: number }>> {
  const montoCentavos = aCentavos(abono.monto);
  if (!Number.isFinite(Number(abono.monto)) || montoCentavos <= 0) {
    return { success: false, message: 'El monto del abono debe ser mayor a 0' };
  }
  if (!esFechaValida(abono.fecha)) {
    return { success: false, message: 'La fecha del abono no es válida' };
  }
  if (!METODOS_PAGO.includes(abono.metodo_pago)) {
    return { success: false, message: 'Método de pago inválido' };
  }

  try {
    const id = await sql.begin(async (tx: any) => {
      const pedidos = await tx`
        SELECT id, total FROM pedidos_seguimiento WHERE id = ${abono.pedido_id} FOR UPDATE
      `;
      if (pedidos.length === 0) throw new ErrorSeguimiento('Pedido no encontrado');

      const sumas = await tx`
        SELECT COALESCE(SUM(monto), 0) AS abonado FROM abonos_pedido WHERE pedido_id = ${abono.pedido_id}
      `;
      const saldoCentavos = aCentavos(pedidos[0].total) - aCentavos(sumas[0].abonado);
      if (saldoCentavos <= 0) throw new ErrorSeguimiento('Este pedido ya está pagado en su totalidad');
      if (montoCentavos > saldoCentavos) {
        throw new ErrorSeguimiento(
          `El abono (L. ${(montoCentavos / 100).toFixed(2)}) supera el saldo pendiente (L. ${(saldoCentavos / 100).toFixed(2)})`
        );
      }

      const insert = await tx`
        INSERT INTO abonos_pedido (pedido_id, fecha, monto, metodo_pago, comprobante, observaciones)
        VALUES (${abono.pedido_id}, ${abono.fecha}, ${montoCentavos / 100}, ${abono.metodo_pago},
                ${String(abono.comprobante || '').trim()}, ${String(abono.observaciones || '').trim()})
        RETURNING id
      `;
      return Number(insert[0].id);
    });

    return { success: true, data: { id: Number(id) } };
  } catch (error) {
    if (error instanceof ErrorSeguimiento) return { success: false, message: error.message };
    console.error('Error en registrarAbonoAction:', error);
    return { success: false, message: 'Error al registrar el abono' };
  }
}

// Mueve pedidos de la pantalla "Pedidos" (tabla pedidos) al módulo de Seguimiento.
// Por cada pedido, en su propia transacción:
//  - crea el pedido en pedidos_seguimiento con el total ya con descuento,
//  - registra como abono lo que ya se había cobrado (anticipo, o el total si estaba "Pagado"),
//  - borra el pedido original para que no quede duplicado ni se pueda despachar dos veces.
// No toca inventario: los bloques se descuentan cuando se registren las entregas.
export async function pasarPedidosASeguimientoAction(
  ids: number[]
): Promise<ServerResult<{ movidos: { pedido_id: number; seguimiento_id: number }[]; errores: string[] }>> {
  const movidos: { pedido_id: number; seguimiento_id: number }[] = [];
  const errores: string[] = [];
  const unicos = Array.from(new Set((ids || []).map(Number))).filter((n) => Number.isInteger(n) && n > 0);

  if (unicos.length === 0) {
    return { success: false, message: 'No se seleccionó ningún pedido' };
  }

  for (const id of unicos) {
    try {
      const seguimientoId = await sql.begin(async (tx: any) => {
        const rows = await tx`
          SELECT id, TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha, cliente, producto, cantidad,
                 precio_unitario, estado_pago, anticipo, descuento_tipo, descuento_valor
          FROM pedidos
          WHERE id = ${id}
          FOR UPDATE
        `;
        if (rows.length === 0) throw new ErrorSeguimiento(`Pedido #${id}: ya no existe`);
        const p = rows[0];

        const producto = String(p.producto || '').toLowerCase();
        const tipo = producto.includes('4')
          ? 'bloque_de_4"'
          : producto.includes('5')
            ? 'bloque_de_5"'
            : producto.includes('6')
              ? 'bloque_de_6"'
              : null;
        if (!tipo) throw new ErrorSeguimiento(`Pedido #${id}: no se reconoce el tipo de bloque "${p.producto}"`);

        const cantidad = Number(p.cantidad);
        const precio = Number(p.precio_unitario);
        if (!Number.isInteger(cantidad) || cantidad <= 0 || !(precio > 0)) {
          throw new ErrorSeguimiento(`Pedido #${id}: cantidad o precio inválidos`);
        }

        const subtotal = (aCentavos(precio) * cantidad) / 100;
        const descuentoTipo: DescuentoTipo = p.descuento_tipo || 'ninguno';
        const descuento = calcularDescuento(subtotal, cantidad, descuentoTipo, Number(p.descuento_valor) || 0);
        const totalCentavos = Math.max(aCentavos(subtotal) - aCentavos(descuento), 0);
        if (totalCentavos <= 0) throw new ErrorSeguimiento(`Pedido #${id}: el total con descuento es 0`);

        // Con descuento, el precio por bloque que se usa en las entregas es el efectivo.
        const precioEfectivo = descuento > 0 ? Math.round(totalCentavos / cantidad) / 100 : precio;
        const fecha = esFechaValida(p.fecha || '') ? p.fecha : new Date().toISOString().slice(0, 10);

        const notas = [`Pasado desde Pedidos #${id}.`];
        if (descuento > 0) {
          notas.push(
            `Descuento aplicado: L. ${(aCentavos(descuento) / 100).toFixed(2)} (precio original L. ${precio.toFixed(2)} por bloque).`
          );
        }

        const insert = await tx`
          INSERT INTO pedidos_seguimiento
            (cliente, fecha, tipo_bloque, cantidad_total, precio_unitario, total, observaciones)
          VALUES
            (${String(p.cliente || '').trim() || 'Sin nombre'}, ${fecha}, ${tipo}, ${cantidad},
             ${precioEfectivo}, ${totalCentavos / 100}, ${notas.join(' ')})
          RETURNING id
        `;
        const nuevoId = Number(insert[0].id);

        // Lo ya cobrado pasa como abono para que el saldo quede correcto.
        let cobradoCentavos = 0;
        let nota = '';
        if (p.estado_pago === 'Pagado') {
          cobradoCentavos = totalCentavos;
          nota = 'Pago completo registrado en Pedidos antes del seguimiento';
        } else if (Number(p.anticipo) > 0) {
          cobradoCentavos = Math.min(aCentavos(p.anticipo), totalCentavos);
          nota = 'Anticipo registrado en Pedidos antes del seguimiento';
        }
        if (cobradoCentavos > 0) {
          await tx`
            INSERT INTO abonos_pedido (pedido_id, fecha, monto, metodo_pago, comprobante, observaciones)
            VALUES (${nuevoId}, ${fecha}, ${cobradoCentavos / 100}, 'Otro', '', ${nota})
          `;
        }

        await tx`DELETE FROM pedidos WHERE id = ${id}`;
        return nuevoId;
      });

      movidos.push({ pedido_id: id, seguimiento_id: Number(seguimientoId) });
    } catch (error) {
      if (error instanceof ErrorSeguimiento) errores.push(error.message);
      else {
        console.error(`Error al pasar pedido #${id} a seguimiento:`, error);
        errores.push(`Pedido #${id}: error al pasarlo`);
      }
    }
  }

  return { success: movidos.length > 0, data: { movidos, errores }, message: errores.join('\n') || undefined };
}
