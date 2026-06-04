-- Configuración del dashboard admin
CREATE TABLE IF NOT EXISTS admin_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  meta_ventas_mensual NUMERIC NOT NULL DEFAULT 0,
  gastos_fijos_mensuales NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: solo usuarios autenticados pueden ver y modificar la configuración admin
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo autenticados admin_config" ON admin_config
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
