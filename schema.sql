-- ===============================================================
-- 1. EXTENSIONES Y TIPOS
-- ===============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('ADMIN', 'USUARIO');

-- ===============================================================
-- 2. TABLAS PRINCIPALES
-- ===============================================================

-- Perfiles de usuario vinculados a Auth
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'USUARIO' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Laboratorios
CREATE TABLE laboratorios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE, -- 'minas', 'agronomia', etc.
    es_cava BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservas Estándar (No Cava)
CREATE TABLE reservas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    laboratorio_id UUID REFERENCES laboratorios(id) ON DELETE CASCADE NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    nombre_responsable TEXT NOT NULL,
    actividad TEXT NOT NULL,
    usuario_creador UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar traslapes (Exclusión)
    CONSTRAINT no_overlap EXCLUDE USING gist (
        laboratorio_id WITH =,
        fecha WITH =,
        tsrange(
            (fecha + hora_inicio)::timestamp, 
            (fecha + hora_fin)::timestamp
        ) WITH &&
    )
);

-- ===============================================================
-- 3. ESTRUCTURA ESPECIAL CAVA
-- ===============================================================

-- Configuración de bloques horarios (ej: 08:00-09:00)
CREATE TABLE cava_bloques_config (
    id SERIAL PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    label TEXT NOT NULL -- '08:00 - 09:00'
);

-- Calendario de disponibilidad de la Cava
CREATE TABLE cava_disponibilidad (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL,
    bloque_id INTEGER REFERENCES cava_bloques_config(id) NOT NULL,
    reserva_id UUID REFERENCES reservas(id) ON DELETE SET NULL, -- Si es NULL, está libre
    UNIQUE(fecha, bloque_id)
);

-- ===============================================================
-- 4. FUNCIONES DE SEGURIDAD
-- ===============================================================

-- Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ===============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ===============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cava_bloques_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cava_disponibilidad ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
CREATE POLICY "Perfiles visibles por todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Solo admin edita roles" ON profiles FOR UPDATE USING (get_my_role() = 'ADMIN');

-- POLICIES: LABORATORIOS
CREATE POLICY "Laboratorios visibles por todos" ON laboratorios FOR SELECT USING (true);
CREATE POLICY "Solo admin gestiona laboratorios" ON laboratorios FOR ALL USING (get_my_role() = 'ADMIN');

-- POLICIES: RESERVAS (Lógica compleja por laboratorio)
CREATE POLICY "Admin CRUD total reservas" ON reservas FOR ALL USING (get_my_role() = 'ADMIN');

CREATE POLICY "Usuario lectura reservas permitidas" ON reservas FOR SELECT 
USING (
    get_my_role() = 'USUARIO' AND (
        laboratorio_id IN (SELECT id FROM laboratorios WHERE slug IN ('agronomia', 'parcela', 'cava'))
    )
);

CREATE POLICY "Usuario inserta en Parcela Demostrativa" ON reservas FOR INSERT
WITH CHECK (
    get_my_role() = 'USUARIO' AND 
    laboratorio_id IN (SELECT id FROM laboratorios WHERE slug = 'parcela') AND
    usuario_creador = auth.uid()
);

-- POLICIES: CAVA
CREATE POLICY "Cava config visible" ON cava_bloques_config FOR SELECT USING (true);
CREATE POLICY "Cava disponibilidad visible" ON cava_disponibilidad FOR SELECT USING (true);
CREATE POLICY "Admin gestiona Cava" ON cava_disponibilidad FOR ALL USING (get_my_role() = 'ADMIN');

-- ===============================================================
-- 6. TRIGGERS Y SEED DATA INICIAL
-- ===============================================================

-- Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'USUARIO'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SEED DATA
INSERT INTO laboratorios (nombre, slug, es_cava) VALUES
('Construcción', 'construccion', false),
('Minería', 'minas', false),
('Informática', 'informatica', false),
('Agronomía', 'agronomia', false),
('Parcela Demostrativa', 'parcela', false),
('Cava', 'cava', true);

INSERT INTO cava_bloques_config (hora_inicio, hora_fin, label) VALUES
('08:00', '09:00', '08:00 - 09:00'),
('09:00', '10:00', '09:00 - 10:00'),
('10:00', '11:00', '10:00 - 11:00'),
('11:00', '12:00', '11:00 - 12:00'),
('12:00', '13:00', '12:00 - 13:00'),
('13:00', '14:00', '13:00 - 14:00'),
('14:00', '15:00', '14:00 - 15:00'),
('15:00', '16:00', '15:00 - 16:00'),
('16:00', '17:00', '16:00 - 17:00'),
('17:00', '18:00', '17:00 - 18:00'),
('18:00', '19:00', '18:00 - 19:00'),
('19:00', '20:00', '19:00 - 20:00');

-- ===============================================================
-- 7. ACTUALIZACIÓN DE ROLES ESPECÍFICOS
-- ===============================================================

-- Una vez que crees los usuarios en Auth, puedes ejecutar esto para asignar el rol de ADMIN
-- Reemplaza con el correo exacto si es necesario
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'gmoscoso@uvm.cl';

-- El usuario user@uvm.cl ya tendrá el rol 'USUARIO' por defecto gracias al trigger.
