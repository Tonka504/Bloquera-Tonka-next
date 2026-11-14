-- Costo de producción y margen por bloque.
-- Precios de compra de la materia prima, usados por getCostosProduccion() en Reportes.
-- Aditivo y seguro de correr más de una vez.

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS precio_bolsa_cemento NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_m3_arena NUMERIC(10, 2) NOT NULL DEFAULT 0;
