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