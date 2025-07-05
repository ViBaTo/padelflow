-- Desactivar RLS temporalmente para que funcione la aplicación
ALTER TABLE paquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE profesores DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Opcional: También desactivar en otras tablas si las tienes
-- ALTER TABLE canchas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE horarios_operacion DISABLE ROW LEVEL SECURITY;
