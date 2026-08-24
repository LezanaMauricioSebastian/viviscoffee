-- Backfill wholesale prices from description promos (cookies: 4+ units)
-- Retail = precio_num; wholesale = precio_mayorista when qty >= min_mayorista

UPDATE productos SET
  precio_mayorista = 2000,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Mantecol';

UPDATE productos SET
  precio_mayorista = 2300,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Cofler Block';

UPDATE productos SET
  precio_mayorista = 2200,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Doble Chocolate';

UPDATE productos SET
  precio_mayorista = 2300,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Bon o Bon';

UPDATE productos SET
  precio_mayorista = 2100,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Red Velvet Rellena con Oreo';

UPDATE productos SET
  precio_mayorista = 2300,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Red Velvet Rellena con Chocolate';

-- Description: less than 4 = $2400, 4+ = $2200 (precio_num was wrongly 2200)
UPDATE productos SET
  precio = '2400',
  precio_num = 2400,
  precio_mayorista = 2200,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie Nuez y Almendra';

UPDATE productos SET
  precio_mayorista = 1600,
  min_mayorista = 4,
  updated_at = now()
WHERE nombre = 'Cookie clásica';
