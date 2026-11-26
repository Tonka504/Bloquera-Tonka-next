-- Cierre de pedidos de Seguimiento: al estar entregados y pagados por completo se
-- genera su factura y salen de la lista activa (cerrarPedidoSeguimientoAction).
-- Se puede ejecutar más de una vez sin problema.

ALTER TABLE pedidos_seguimiento
  ADD COLUMN IF NOT EXISTS cerrado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS num_factura INTEGER;

-- Marca las facturas que vienen de Seguimiento. Sus ventas ya se cuentan por las
-- entregas (en su fecha real), así que los totales de ventas las excluyen.
ALTER TABLE historial_facturas
  ADD COLUMN IF NOT EXISTS seguimiento_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_historial_facturas_seguimiento ON historial_facturas (seguimiento_id);
