'use server';

import { sql } from '../lib/db';

// ============================================================
// LOGIN
// ============================================================
export async function loginAction(username: string, password: string) {
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

    const user = users[0];
    return { success: true, user };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al iniciar sesión' };
  }
}

// ============================================================
// DASHBOARD - RESUMEN ENRIQUECIDO (SUPER DEFENSIVO)
// ============================================================
export async function getDashboardResumen() {
  let totalVentas = 0;
  let totalGastos = 0;
  let totalPorCobrar = 0;
  let pedidosRecientes: any[] = [];
  let ventasPorMes: any[] = [];
  let stockBajo: any[] = [];
  let facturasPendientes: any[] = [];

  try {
    const ventasResult = await sql`SELECT COALESCE(SUM(total_venta), 0) as total FROM historial_facturas`;
    totalVentas = Number(ventasResult[0]?.total || 0);
  } catch (e) {
    console.log('Error ventas:', e);
  }

  try {
    const gastosResult = await sql`SELECT COALESCE(SUM(monto), 0) as total FROM gastos`;
    totalGastos = Number(gastosResult[0]?.total || 0);
  } catch (e) {
    console.log('Error gastos:', e);
  }

  try {
    const cobrarResult = await sql`SELECT COALESCE(SUM(saldo_pendiente), 0) as total FROM historial_facturas`;
    totalPorCobrar = Number(cobrarResult[0]?.total || 0);
  } catch (e) {
    console.log('Error por cobrar:', e);
  }

  try {
    pedidosRecientes = await sql`
      SELECT id, cliente, producto, cantidad, estado, fecha 
      FROM pedidos 
      ORDER BY id DESC 
      LIMIT 5
    `;
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
    `;
  } catch (e) {
    console.log('Error ventas por mes:', e);
  }

  try {
    stockBajo = await sql`
      SELECT tipo, cantidad 
      FROM inventario 
      WHERE tipo LIKE 'bloque_de_%' AND cantidad < 100
      ORDER BY cantidad ASC
    `;
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
    `;
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
    }
  };
}

// ============================================================
// PEDIDOS
// ============================================================
export async function getPedidos() {
  try {
    const data = await sql`SELECT * FROM pedidos ORDER BY id DESC`;
    return { success: true, data };
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
}) {
  try {
    await sql`
      INSERT INTO pedidos (fecha, cliente, producto, cantidad, precio_unitario, estado, estado_pago, anticipo)
      VALUES (${pedido.fecha}, ${pedido.cliente}, ${pedido.producto}, 
              ${pedido.cantidad}, ${pedido.precio_unitario}, ${pedido.estado}, ${pedido.estado_pago}, ${pedido.anticipo})
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al crear pedido' };
  }
}

export async function eliminarPedidoAction(id: number) {
  try {
    await sql`DELETE FROM pedidos WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al eliminar pedido' };
  }
}

export async function despacharPedidoAction(id: number, datosFactura?: {
  fecha_despacho?: string;
  identidad?: string;
  rtn?: string;
  direccion?: string;
  estado_pago?: string;
}) {
  try {
    const pedidos = await sql`SELECT * FROM pedidos WHERE id = ${id} LIMIT 1`;
    if (pedidos.length === 0) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    const pedido = pedidos[0];
    const total = Number(pedido.cantidad) * Number(pedido.precio_unitario);
    const anticipo = Number(pedido.anticipo) || 0;

    // Al despachar, el pedido se considera PAGADO (se entregó el producto)
    const estadoPago = 'Pagado';
    const saldoPendiente = 0;

    await sql`
      INSERT INTO historial_facturas 
      (fecha_despacho, cliente, producto, cantidad, total_venta, estado, anticipo, saldo_pendiente, 
       identidad, rtn, direccion)
      VALUES (
        ${datosFactura?.fecha_despacho || new Date().toISOString().split('T')[0]},
        ${pedido.cliente},
        ${pedido.producto},
        ${pedido.cantidad},
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

    return { success: true, message: 'Pedido despachado correctamente' };
  } catch (error) {
    console.error('Error en despacharPedidoAction:', error);
    return { success: false, message: 'Error al despachar el pedido' };
  }
}

// ============================================================
// GASTOS
// ============================================================
export async function getGastos() {
  try {
    const data = await sql`SELECT * FROM gastos ORDER BY id DESC`;
    return { success: true, data };
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
}) {
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

export async function eliminarGastoAction(id: number) {
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
export async function getInventario() {
  try {
    const data = await sql`SELECT tipo, cantidad FROM inventario`;
    const inventario: Record<string, number> = {};
    data.forEach((row: any) => {
      inventario[row.tipo] = Number(row.cantidad);
    });
    return { success: true, data: inventario };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar inventario' };
  }
}

export async function getHistorialInventario() {
  try {
    const data = await sql`
      SELECT * FROM historial_inventario 
      ORDER BY fecha DESC, id DESC 
      LIMIT 50
    `;
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar historial' };
  }
}

export async function abastecerInventarioAction(cemento: number, arena: number) {
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

export async function producirBloquesAction(producto: string, cantidad: number) {
  try {
    const config = await sql`SELECT * FROM configuracion LIMIT 1`;
    if (config.length === 0) {
      return { success: false, message: 'No hay configuración de producción' };
    }

    const bloquesPorBolsa = Number(config[0].bloques_por_bolsa) || 36;
    const arenaPor100 = Number(config[0].arena_por_100_bloques) || 0.40;

    const cementoNecesario = cantidad / bloquesPorBolsa;
    const arenaNecesaria = (cantidad / 100) * arenaPor100;

    const inventario = await sql`SELECT tipo, cantidad FROM inventario`;
    const stock: Record<string, number> = {};
    inventario.forEach((row: any) => {
      stock[row.tipo] = Number(row.cantidad);
    });

    const cementoActual = stock['cemento_bolsas'] || 0;
    const arenaActual = stock['arena_m3'] || 0;

    if (cementoActual < cementoNecesario) {
      return { 
        success: false, 
        message: `No hay suficiente cemento. Necesitas ${Math.ceil(cementoNecesario)} bolsas y tienes ${cementoActual}` 
      };
    }

    if (arenaActual < arenaNecesaria) {
      return { 
        success: false, 
        message: `No hay suficiente arena. Necesitas ${arenaNecesaria.toFixed(2)} m³ y tienes ${arenaActual}` 
      };
    }

    const cementoBolsas = Math.ceil(cementoNecesario);
    await sql`
      UPDATE inventario 
      SET cantidad = cantidad - ${cementoBolsas} 
      WHERE tipo = 'cemento_bolsas'
    `;
    await sql`
      INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
      VALUES ('cemento_bolsas', ${cementoBolsas}, 'produccion_uso', NOW())
    `;

    await sql`
      UPDATE inventario 
      SET cantidad = cantidad - ${arenaNecesaria} 
      WHERE tipo = 'arena_m3'
    `;
    await sql`
      INSERT INTO historial_inventario (tipo, cantidad, accion, fecha)
      VALUES ('arena_m3', ${arenaNecesaria}, 'produccion_uso', NOW())
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
      message: `Producción exitosa. Se usaron ${Math.ceil(cementoNecesario)} bolsas de cemento y ${arenaNecesaria.toFixed(2)} m³ de arena.`
    };
  } catch (error) {
    console.error('Error en producirBloquesAction:', error);
    return { success: false, message: 'Error en la producción' };
  }
}

// ============================================================
// FACTURAS
// ============================================================
export async function getFacturas() {
  try {
    const data = await sql`
      SELECT 
        num_factura,
        fecha_despacho,
        cliente,
        producto,
        cantidad,
        total_venta,
        estado,
        anticipo,
        saldo_pendiente,
        identidad,
        rtn,
        direccion
      FROM historial_facturas 
      ORDER BY num_factura DESC
    `;
    return { success: true, data };
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
}) {
  try {
    let query = sql`
      SELECT 
        num_factura,
        fecha_despacho,
        cliente,
        producto,
        cantidad,
        total_venta,
        estado,
        anticipo,
        saldo_pendiente,
        identidad,
        rtn,
        direccion
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
    return { success: true, data };
  } catch (error) {
    console.error('Error en getFacturasFiltradas:', error);
    return { success: false, message: 'Error al filtrar facturas' };
  }
}

export async function actualizarEstadoFactura(numFactura: number, nuevoEstado: string) {
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
// REPORTES (SUPER DEFENSIVO)
// ============================================================
export async function getReporteGeneral() {
  let totalVentas = 0;
  let totalGastos = 0;
  let totalBloquesStock = 0;
  let totalFacturas = 0;
  let totalPedidosPendientes = 0;
  let ventasPorMes: any[] = [];
  let gastosPorCategoria: any[] = [];
  let topClientes: any[] = [];

  try {
    const ventas = await sql`SELECT COALESCE(SUM(total_venta), 0) as total FROM historial_facturas`;
    totalVentas = Number(ventas[0]?.total || 0);
  } catch (e) { console.log('Error ventas reporte:', e); }

  try {
    const gastos = await sql`SELECT COALESCE(SUM(monto), 0) as total FROM gastos`;
    totalGastos = Number(gastos[0]?.total || 0);
  } catch (e) { console.log('Error gastos reporte:', e); }

  try {
    const bloques = await sql`
      SELECT SUM(cantidad) as total 
      FROM inventario 
      WHERE tipo LIKE 'bloque_de_%'
    `;
    totalBloquesStock = Number(bloques[0]?.total || 0);
  } catch (e) { console.log('Error bloques reporte:', e); }

  try {
    const facturas = await sql`SELECT COUNT(*) as total FROM historial_facturas`;
    totalFacturas = Number(facturas[0]?.total || 0);
  } catch (e) { console.log('Error facturas reporte:', e); }

  try {
    const pedidosPendientes = await sql`SELECT COUNT(*) as total FROM pedidos WHERE estado = 'Pendiente'`;
    totalPedidosPendientes = Number(pedidosPendientes[0]?.total || 0);
  } catch (e) { console.log('Error pedidos reporte:', e); }

  try {
    const fechaDesde = '2026-02-19';
    ventasPorMes = await sql`
      SELECT 
        SUBSTRING(fecha_despacho::text, 1, 7) as mes,
        COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      WHERE fecha_despacho >= ${fechaDesde}
      GROUP BY SUBSTRING(fecha_despacho::text, 1, 7)
      ORDER BY mes ASC
    `;
  } catch (e) { console.log('Error ventas por mes reporte:', e); }

  try {
    gastosPorCategoria = await sql`
      SELECT categoria, COALESCE(SUM(monto), 0) as total
      FROM gastos
      GROUP BY categoria
      ORDER BY total DESC
    `;
  } catch (e) { console.log('Error gastos categoria reporte:', e); }

  try {
    topClientes = await sql`
      SELECT cliente, COALESCE(SUM(total_venta), 0) as total
      FROM historial_facturas
      GROUP BY cliente
      ORDER BY total DESC
      LIMIT 5
    `;
  } catch (e) { console.log('Error top clientes reporte:', e); }

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
    }
  };
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
export async function getConfiguracion() {
  try {
    const data = await sql`SELECT * FROM configuracion LIMIT 1`;
    if (data.length === 0) {
      return { success: false, message: 'No hay configuración' };
    }
    return { success: true, data: data[0] };
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
}) {
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
