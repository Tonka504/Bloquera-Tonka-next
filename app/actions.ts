'use server';

import { sql } from '@/lib/db';

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
// Obtener resumen del Dashboard
export async function getDashboardResumen() {
  try {
    // Ventas totales
    const ventasResult = await sql`SELECT COALESCE(SUM(total_venta), 0) as total FROM historial_facturas`;
    const totalVentas = Number(ventasResult[0]?.total || 0);

    // Gastos totales
    const gastosResult = await sql`SELECT COALESCE(SUM(monto), 0) as total FROM gastos`;
    const totalGastos = Number(gastosResult[0]?.total || 0);

    // Por cobrar
    const cobrarResult = await sql`SELECT COALESCE(SUM(saldo_pendiente), 0) as total FROM historial_facturas`;
    const totalPorCobrar = Number(cobrarResult[0]?.total || 0);

    return {
      success: true,
      data: {
        ventas: totalVentas,
        gastos: totalGastos,
        balance: totalVentas - totalGastos,
        por_cobrar: totalPorCobrar,
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar datos del dashboard' };
  }
}
// Obtener todos los pedidos
export async function getPedidos() {
  try {
    const data = await sql`SELECT * FROM pedidos ORDER BY id DESC`;
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar pedidos' };
  }
}

// Crear pedido
export async function crearPedidoAction(pedido: any) {
  try {
    await sql`
      INSERT INTO pedidos (fecha, cliente, producto, cantidad, precio_unitario, estado)
      VALUES (${pedido.fecha}, ${pedido.cliente}, ${pedido.producto}, 
              ${pedido.cantidad}, ${pedido.precio_unitario}, ${pedido.estado})
    `;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al crear pedido' };
  }
}

// Eliminar pedido
export async function eliminarPedidoAction(id: number) {
  try {
    await sql`DELETE FROM pedidos WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al eliminar pedido' };
  }
}
// Obtener todos los gastos
export async function getGastos() {
  try {
    const data = await sql`SELECT * FROM gastos ORDER BY id DESC`;
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar gastos' };
  }
}

// Crear gasto
export async function crearGastoAction(gasto: any) {
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

// Eliminar gasto
export async function eliminarGastoAction(id: number) {
  try {
    await sql`DELETE FROM gastos WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al eliminar gasto' };
  }
}
// Obtener inventario
export async function getInventario() {
  try {
    const data = await sql`SELECT tipo, cantidad FROM inventario`;
    const inventario: any = {};
    data.forEach((row: any) => {
      inventario[row.tipo] = Number(row.cantidad);
    });
    return { success: true, data: inventario };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al cargar inventario' };
  }
}

// Abastecer inventario
export async function abastecerInventarioAction(cemento: number, arena: number) {
  try {
    if (cemento > 0) {
      await sql`
        UPDATE inventario 
        SET cantidad = cantidad + ${cemento} 
        WHERE tipo = 'cemento_bolsas'
      `;
    }
    if (arena > 0) {
      await sql`
        UPDATE inventario 
        SET cantidad = cantidad + ${arena} 
        WHERE tipo = 'arena_m3'
      `;
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al abastecer inventario' };
  }
}

// Producir bloques (versión simplificada)
export async function despacharPedidoAction(id: number, datosFactura?: any) {
  try {
    // 1. Obtener el pedido
    const pedidos = await sql`SELECT * FROM pedidos WHERE id = ${id} LIMIT 1`;
    if (pedidos.length === 0) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    const pedido = pedidos[0];
    const total = Number(pedido.cantidad) * Number(pedido.precio_unitario);
    const anticipo = Number(pedido.anticipo) || 0;

    // 2. Crear la factura
    await sql`
      INSERT INTO historial_facturas 
      (fecha_despacho, cliente, producto, cantidad, total_venta, estado, anticipo, saldo_pendiente, 
       identidad, rtn, direccion)
      VALUES (
        ${datosFactura?.fecha || new Date().toISOString().split('T')[0]},
        ${pedido.cliente},
        ${pedido.producto},
        ${pedido.cantidad},
        ${total},
        'Pagado',
        ${anticipo},
        ${Math.max(total - anticipo, 0)},
        ${datosFactura?.identidad || ''},
        ${datosFactura?.rtn || ''},
        ${datosFactura?.direccion || 'SANTA BARBARA, S.B., HONDURAS'}
      )
    `;

    // 3. Descontar del inventario (versión simplificada)
    const producto = String(pedido.producto).toLowerCase();

    if (producto.includes('4')) {
      await sql`
        UPDATE inventario 
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0) 
        WHERE tipo = 'bloque_de_4"'
      `;
    } 
    else if (producto.includes('5')) {
      await sql`
        UPDATE inventario 
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0) 
        WHERE tipo = 'bloque_de_5"'
      `;
    } 
    else if (producto.includes('6')) {
      await sql`
        UPDATE inventario 
        SET cantidad = GREATEST(cantidad - ${pedido.cantidad}, 0) 
        WHERE tipo = 'bloque_de_6"'
      `;
    }

    // 4. Eliminar el pedido
    await sql`DELETE FROM pedidos WHERE id = ${id}`;

    return { success: true };
  } catch (error) {
    console.error('Error en despacharPedidoAction:', error);
    return { success: false, message: 'Error al despachar el pedido' };
  }
}

// Obtener todas las facturas
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
// Producir bloques (sumar al inventario)
export async function producirBloquesAction(producto: string, cantidad: number) {
  try {
    // 1. Obtener configuración actual
    const config = await sql`SELECT * FROM configuracion LIMIT 1`;
    if (config.length === 0) {
      return { success: false, message: 'No hay configuración de producción' };
    }

    const bloquesPorBolsa = Number(config[0].bloques_por_bolsa) || 42;
    const arenaPor100 = Number(config[0].arena_por_100_bloques) || 0.40;

    // 2. Calcular materiales necesarios
    const cementoNecesario = cantidad / bloquesPorBolsa;
    const arenaNecesaria = (cantidad / 100) * arenaPor100;

    // 3. Verificar stock actual
    const inventario = await sql`SELECT tipo, cantidad FROM inventario`;
    const stock: any = {};
    inventario.forEach((row: any) => {
      stock[row.tipo] = Number(row.cantidad);
    });

    const cementoActual = stock['cemento_bolsas'] || 0;
    const arenaActual = stock['arena_m3'] || 0;

    if (cementoActual < cementoNecesario) {
      return { 
        success: false, 
        message: `No hay suficiente cemento. Necesitas ${cementoNecesario.toFixed(2)} bolsas y tienes ${cementoActual}` 
      };
    }

    if (arenaActual < arenaNecesaria) {
      return { 
        success: false, 
        message: `No hay suficiente arena. Necesitas ${arenaNecesaria.toFixed(2)} m³ y tienes ${arenaActual}` 
      };
    }

    // 4. Descontar materiales y sumar bloques
    await sql`
      UPDATE inventario 
      SET cantidad = cantidad - ${cementoNecesario} 
      WHERE tipo = 'cemento_bolsas'
    `;

    await sql`
      UPDATE inventario 
      SET cantidad = cantidad - ${arenaNecesaria} 
      WHERE tipo = 'arena_m3'
    `;

    await sql`
      UPDATE inventario 
      SET cantidad = cantidad + ${cantidad} 
      WHERE tipo = ${producto}
    `;

    return { 
      success: true,
      message: `Producción exitosa. Se usaron ${cementoNecesario.toFixed(2)} bolsas de cemento y ${arenaNecesaria.toFixed(2)} m³ de arena.`
    };
  } catch (error) {
    console.error('Error en producirBloquesAction:', error);
    return { success: false, message: 'Error en la producción' };
  }
}
// === REPORTES ===

// Reporte General
export async function getReporteGeneral() {
  try {
    // Ventas totales
    const ventas = await sql`SELECT COALESCE(SUM(total_venta), 0) as total FROM historial_facturas`;
    const totalVentas = Number(ventas[0]?.total || 0);

    // Gastos totales
    const gastos = await sql`SELECT COALESCE(SUM(monto), 0) as total FROM gastos`;
    const totalGastos = Number(gastos[0]?.total || 0);

    // Ganancia neta
    const ganancia = totalVentas - totalGastos;

    // Total de bloques en inventario
    const bloques = await sql`
      SELECT SUM(cantidad) as total 
      FROM inventario 
      WHERE tipo LIKE 'bloque_de_%'
    `;
    const totalBloquesStock = Number(bloques[0]?.total || 0);

    // Total de facturas emitidas
    const facturas = await sql`SELECT COUNT(*) as total FROM historial_facturas`;
    const totalFacturas = Number(facturas[0]?.total || 0);

    // Total de pedidos pendientes
    const pedidosPendientes = await sql`SELECT COUNT(*) as total FROM pedidos WHERE estado = 'Pendiente'`;
    const totalPedidosPendientes = Number(pedidosPendientes[0]?.total || 0);

    return {
      success: true,
      data: {
        totalVentas,
        totalGastos,
        ganancia,
        totalBloquesStock,
        totalFacturas,
        totalPedidosPendientes
      }
    };
  } catch (error) {
    console.error('Error en getReporteGeneral:', error);
    return { success: false, message: 'Error al generar reporte' };
  }
}