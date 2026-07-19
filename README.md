# 🏗️ Bloquera Tonka - Versión Mejorada

## ✅ Cambios realizados

### Dashboard
- ✅ Gráfico de ventas por mes (últimos 6 meses)
- ✅ Alertas de stock bajo
- ✅ Pedidos recientes
- ✅ Facturas pendientes de cobro

### Pedidos
- ✅ Búsqueda por cliente, producto o ID
- ✅ Modal de despacho COMPLETO con:
  - Fecha de despacho
  - Identidad del cliente
  - RTN
  - Dirección
- ✅ Guarda correctamente el estado de pago y anticipo
- ✅ Validaciones en formularios (cantidad > 0, precio > 0, anticipo válido)
- ✅ Modal de confirmación antes de eliminar
- ✅ Muestra total calculado y estado de pago en la tabla

### Facturas
- ✅ Búsqueda por cliente, producto o número
- ✅ Filtros por estado (Pagado, Con Anticipo, Pendiente)
- ✅ Filtros por rango de fechas
- ✅ Paginación (10 items por página)
- ✅ Cambiar estado de pago directamente desde la tabla
- ✅ Muestra saldo pendiente

### Inventario
- ✅ Alertas de stock bajo en la página
- ✅ Indicadores de estado (Normal, Bajo, Agotado) en cada producto
- ✅ Modal de historial de movimientos
- ✅ Registro automático de movimientos en historial_inventario
- ✅ Validaciones en formularios

### Gastos
- ✅ Búsqueda por descripción
- ✅ Filtro por categoría
- ✅ Total de gastos filtrados
- ✅ Modal de confirmación antes de eliminar
- ✅ Validaciones en formularios
- ✅ Colores diferentes por categoría

### Reportes
- ✅ Gráfico de ventas por mes
- ✅ Gráfico de gastos por categoría (barras horizontales)
- ✅ Top 5 clientes por ventas
- ✅ Todos los KPIs principales

### Configuración
- ✅ Conectada a la base de datos (lee y guarda)
- ✅ Carga configuración real al abrir
- ✅ Guarda cambios en la DB

### PDF de Facturas
- ✅ Muestra anticipo recibido
- ✅ Muestra saldo pendiente si existe
- ✅ Muestra dirección del cliente

## 🗄️ Migraciones necesarias

Ejecuta el archivo `migraciones.sql` en tu base de datos PostgreSQL antes de usar la app mejorada.

## 📁 Archivos modificados/creados

- `app/actions.ts` — Nuevas funciones del servidor
- `app/dashboard/page.tsx` — Dashboard enriquecido
- `app/dashboard/pedidos/page.tsx` — Pedidos mejorados
- `app/dashboard/facturas/page.tsx` — Facturas con filtros y paginación
- `app/dashboard/inventario/page.tsx` — Inventario con alertas e historial
- `app/dashboard/gastos/page.tsx` — Gastos con búsqueda y filtros
- `app/dashboard/reportes/page.tsx` — Reportes con gráficos
- `app/dashboard/config/page.tsx` — Configuración conectada a DB
- `lib/generateInvoicePDF.ts` — PDF mejorado
- `migraciones.sql` — Script SQL para actualizar la base de datos

## 🚀 Cómo instalar

1. Reemplaza los archivos en tu proyecto con los de esta carpeta
2. Ejecuta `migraciones.sql` en tu base de datos PostgreSQL
3. Corre `npm run dev` y prueba todo
