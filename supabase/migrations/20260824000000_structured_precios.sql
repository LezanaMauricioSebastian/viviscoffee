-- Precios estructurados: numérico, mayorista y "a consultar"
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_num NUMERIC,
  ADD COLUMN IF NOT EXISTS precio_mayorista NUMERIC,
  ADD COLUMN IF NOT EXISTS min_mayorista INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS precio_a_consultar BOOLEAN DEFAULT false;

-- Backfill desde precio TEXT existente (valores puramente numéricos)
UPDATE productos
SET precio_num = NULLIF(regexp_replace(precio, '[^\d]', '', 'g'), '')::numeric
WHERE precio ~ '^\d+$';

UPDATE productos
SET precio_a_consultar = true
WHERE precio !~ '^\d+$' OR precio IS NULL;
