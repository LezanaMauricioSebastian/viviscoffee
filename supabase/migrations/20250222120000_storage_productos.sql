-- Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (cualquiera puede ver las imágenes)
CREATE POLICY "Lectura pública de imágenes"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Solo autenticados pueden subir
CREATE POLICY "Autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- Solo autenticados pueden actualizar sus archivos
CREATE POLICY "Autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- Solo autenticados pueden eliminar
CREATE POLICY "Autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
USING (bucket_id = 'productos' AND auth.role() = 'authenticated');
