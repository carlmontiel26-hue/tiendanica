-- FASE 1 - Portada + QR + App
-- Pega esto en Supabase > SQL Editor > Run

-- Agregar portada
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Asegurar que exista is_active etc (por si acaso)
-- ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verificar
SELECT * FROM stores LIMIT 1;
