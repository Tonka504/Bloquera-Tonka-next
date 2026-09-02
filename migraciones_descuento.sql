-- Migración: soporte de descuento en pedidos y facturas.
-- Ejecuta este archivo contra tu base de datos Postgres antes de usar la
-- nueva funcionalidad de descuentos (ver app/actions.ts).
--
-- Modos de descuento soportados (columna descuento_tipo):
--   'ninguno'     -> sin descuento
--   'automatico'  -> 10% si la cantidad de bloques es mayor a 500 (activable/desactivable por pedido/factura)
--   'porcentaje'  -> % manual, usa descuento_valor (0-100)
--   'monto'       -> monto fijo en L., usa descuento_valor

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS descuento_tipo VARCHAR(20) NOT NULL DEFAULT 'ninguno',
  ADD COLUMN IF NOT EXISTS descuento_valor NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE historial_facturas
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS descuento_tipo VARCHAR(20) NOT NULL DEFAULT 'ninguno',
  ADD COLUMN IF NOT EXISTS descuento_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Backfill: las facturas existentes no tenían descuento, así que su
-- subtotal es igual al total ya cobrado.
UPDATE historial_facturas SET subtotal = total_venta WHERE subtotal IS NULL;

ALTER TABLE historial_facturas ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE historial_facturas ALTER COLUMN subtotal SET DEFAULT 0;
