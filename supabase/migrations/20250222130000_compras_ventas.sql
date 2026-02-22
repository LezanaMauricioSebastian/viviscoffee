-- Compras de insumos (harina, café, etc.)
CREATE TABLE IF NOT EXISTS compras_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT NOT NULL,
  cantidad TEXT,
  unidad TEXT,
  monto NUMERIC NOT NULL,
  proveedor TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL,
  detalle TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras_insumos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);

-- RLS: solo admin (autenticados) puede ver y modificar
ALTER TABLE compras_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo autenticados compras" ON compras_insumos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados ventas" ON ventas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
