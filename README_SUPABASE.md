# Guía de Integración Supabase - LabReserve

## 1. Configuración en Supabase Dashboard

1. **SQL Editor**: Copia y ejecuta el contenido de `schema.sql`. Esto creará las tablas, tipos, triggers y políticas de seguridad (RLS).
2. **Authentication**: 
   - Habilita el proveedor de Google o Email/Password según prefieras.
   - En `Auth Settings`, asegúrate de que el sitio esté permitido.
3. **API Settings**: Obtén tu `Project URL` y `Anon Key`.

## 2. Variables de Entorno

Crea un archivo `.env` basado en `.env.example` y rellena los valores:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Orden de Ejecución SQL

Es crítico seguir este orden (ya manejado en `schema.sql`):
1. Extensiones (`btree_gist`).
2. Tipos Enums.
3. Tablas base (`profiles`, `laboratorios`).
4. Tablas de negocio (`reservas`).
5. Estructura Cava.
6. Funciones y Triggers.
7. RLS y Políticas.

## 4. Consideraciones de Seguridad (RLS)

- **Aislamiento**: Las políticas de RLS en la tabla `reservas` garantizan que un `USUARIO` solo pueda ver laboratorios específicos y solo insertar en `Parcela Demostrativa`.
- **Integridad**: El `CONSTRAINT no_overlap` en PostgreSQL evita que existan dos reservas en el mismo laboratorio y fecha que se traslapen en el tiempo, incluso si el frontend falla al validar.
- **Roles**: El rol se gestiona en la tabla `profiles`. Por defecto, los nuevos usuarios son `USUARIO`. Para promover a alguien a `ADMIN`, debes hacerlo manualmente en la tabla `profiles` desde el dashboard de Supabase.

## 5. Uso de Hooks

- `useAuth()`: Detecta si hay sesión activa.
- `useProfile(id)`: Obtiene el rol y datos del perfil.
- `useReservas(labId)`: CRUD de reservas estándar.
- `useReservasCava(fecha)`: Consulta de bloques para la Cava.
