-- Ejecuta este código en el SQL Editor de Supabase (Dashboard -> SQL Editor -> New Query)

-- 1. Tabla para Ferias/Eventos
CREATE TABLE IF NOT EXISTS ferias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en Ferias
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
-- Cualquier usuario autenticado puede ver las ferias
CREATE POLICY "Empleados pueden ver ferias" ON ferias FOR SELECT TO authenticated USING (true);
-- Solo los administradores pueden crear, editar y borrar ferias
CREATE POLICY "Admins manage ferias" ON ferias FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin' OR auth.email() = 'macario@duke.com');

-- Datos de prueba para ferias
INSERT INTO ferias (name, start_date, end_date, location) VALUES 
('Feria de Abril (Sevilla)', '2026-04-14', '2026-04-20', 'Recinto Ferial Los Remedios'),
('Feria de Málaga', '2026-08-15', '2026-08-22', 'Cortijo de Torres');


-- 2. Tabla para Registros de Fichaje
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('Entrada', 'Salida')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC,
  longitude NUMERIC
);

-- Habilitar RLS en Registros de Fichaje
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
-- Los usuarios pueden leer y crear sus propios registros (y los admin pueden ver todos)
CREATE POLICY "Lectura de registros propios" ON time_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');
CREATE POLICY "Insertar registros propios" ON time_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Tabla para asignar trabajadores a ferias
CREATE TABLE IF NOT EXISTS feria_workers (
  feria_id UUID REFERENCES ferias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (feria_id, user_id)
);

ALTER TABLE feria_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage feria_workers" ON feria_workers FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin' OR auth.email() = 'macario@duke.com');
CREATE POLICY "Users view assigned ferias" ON feria_workers FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');
