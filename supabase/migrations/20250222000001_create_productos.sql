-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio TEXT,
  descripcion TEXT,
  img TEXT,
  categoria TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para filtrar por categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- RLS: cualquiera puede leer; solo autenticados pueden insertar/actualizar/eliminar
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública" ON productos FOR SELECT USING (true);

CREATE POLICY "Solo autenticados pueden insertar" ON productos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden actualizar" ON productos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden eliminar" ON productos
  FOR DELETE USING (auth.role() = 'authenticated');
