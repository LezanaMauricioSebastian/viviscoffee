# Migración Supabase

## 1. Crear la tabla `productos`

En el [Dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**, ejecuta el contenido de:

```
supabase/migrations/20250222000001_create_productos.sql
```

O ejecuta directamente:

```sql
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

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública" ON productos FOR SELECT USING (true);
CREATE POLICY "Solo autenticados pueden insertar" ON productos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Solo autenticados pueden actualizar" ON productos
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo autenticados pueden eliminar" ON productos
  FOR DELETE USING (auth.role() = 'authenticated');
```

## 2. Importar datos iniciales

1. Inicia sesión en `/login` con tu usuario de Supabase
2. Ve a `/admin`
3. Clic en **"Importar desde Google Sheets"** para cargar los productos desde el CSV actual
