-- ============================================================
-- MÓDULO: Seguimiento de pedidos con entregas parciales y abonos
-- ============================================================
-- Solo AGREGA tablas nuevas. No toca pedidos, historial_facturas,
-- inventario ni ninguna tabla existente.
-- Es seguro ejecutarlo más de una vez (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS pedidos_seguimiento (
  id              SERIAL PRIMARY KEY,               -- número de pedido automático
  cliente         TEXT          NOT NULL,
  fecha           DATE          NOT NULL DEFAULT CURRENT_DATE,
  tipo_bloque     TEXT          NOT NULL,           -- 'bloque_de_4"' | 'bloque_de_5"' | 'bloque_de_6"' (igual que inventario.tipo)
  cantidad_total  INTEGER       NOT NULL CHECK (cantidad_total > 0),
  precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario > 0),
  total           NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  observaciones   TEXT          NOT NULL DEFAULT '',
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Historial de entregas: solo se insertan filas, nunca se editan ni borran.
CREATE TABLE IF NOT EXISTS entregas_pedido (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER       NOT NULL REFERENCES pedidos_seguimiento(id) ON DELETE RESTRICT,
  fecha           DATE          NOT NULL DEFAULT CURRENT_DATE,
  cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario > 0),
  total           NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  observaciones   TEXT          NOT NULL DEFAULT '',
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido_pedido ON entregas_pedido(pedido_id);

-- Historial de abonos: solo se insertan filas, nunca se editan ni borran.
CREATE TABLE IF NOT EXISTS abonos_pedido (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER       NOT NULL REFERENCES pedidos_seguimiento(id) ON DELETE RESTRICT,
  fecha           DATE          NOT NULL DEFAULT CURRENT_DATE,
  monto           NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  metodo_pago     TEXT          NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Tarjeta', 'Otro')),
  comprobante     TEXT          NOT NULL DEFAULT '',
  observaciones   TEXT          NOT NULL DEFAULT '',
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abonos_pedido_pedido ON abonos_pedido(pedido_id);
