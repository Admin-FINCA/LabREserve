# LabReserve - Prototipo de Reserva de Espacios

Este es un prototipo funcional para la gestión de reservas en laboratorios y espacios especializados.

## Tecnologías Utilizadas
- **React 19** (Hooks, Componentes Funcionales)
- **Tailwind CSS 4** (Estilizado utilitario)
- **Motion** (Animaciones y transiciones)
- **Lucide React** (Iconografía)
- **Date-fns** (Lógica de calendario)

## Estructura del Proyecto
- `src/App.tsx`: Componente principal que gestiona el estado global de las reservas.
- `src/components/Sidebar.tsx`: Navegación lateral entre los diferentes espacios.
- `src/components/LabSchedule.tsx`: Vista de grilla semanal para laboratorios estándar.
- `src/components/CavaCalendar.tsx`: Vista de calendario mensual con bloques horarios para la Cava.
- `src/components/Modal.tsx`: Diálogo de confirmación de reserva exitosa.

## Cómo Ejecutar
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Funcionalidades
- **Navegación**: Cambia entre diferentes laboratorios desde la barra lateral.
- **Grilla Semanal**: Visualiza la disponibilidad de Lunes a Sábado (08:00 - 20:00).
- **Calendario Mensual**: Navega entre meses y selecciona días específicos para ver bloques horarios.
- **Reservas**: Haz clic en cualquier bloque "Disponible" (Verde) para reservarlo (Rojo).
- **Persistencia**: Las reservas se mantienen en el estado local durante la sesión actual.
