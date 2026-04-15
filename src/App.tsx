/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import LabSchedule from './components/LabSchedule';
import CavaCalendar from './components/CavaCalendar';
import Modal from './components/Modal';
import Login from './components/Login';
import { format, parse } from 'date-fns';
import { useAuth, useProfile, useLaboratorios, useReservas } from './hooks/useSupabase';

export default function App() {
  const [selectedSpace, setSelectedSpace] = useState('minas');
  const { user, loading: authLoading } = useAuth();
  const { profile, isAdmin, loading: profileLoading } = useProfile(user?.id);
  const { laboratorios } = useLaboratorios();
  
  // Encontrar el ID del laboratorio actual basado en el slug (selectedSpace)
  const currentLab = useMemo(() => 
    laboratorios.find(l => l.slug === selectedSpace),
    [laboratorios, selectedSpace]
  );

  const { reservas: dbReservas, createReserva, updateReserva, deleteReserva, loading: resLoading } = useReservas(currentLab?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingReservationData, setPendingReservationData] = useState(null);
  const [optimisticReservations, setOptimisticReservations] = useState({});

  // Mapear reservas de la DB al formato que esperan los componentes visuales
  const reservations = useMemo(() => {
    const map = {};
    dbReservas.forEach(res => {
      if (currentLab?.es_cava) {
        const hour = parseInt(res.hora_inicio.split(':')[0]);
        const key = `cava-${res.fecha}-${hour}`;
        map[key] = { 
          id: res.id,
          activity: res.actividad, 
          responsible: res.nombre_responsable, 
          usuario_creador: res.usuario_creador,
          status: 'confirmed'
        };
      } else {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dateObj = new Date(res.fecha + 'T12:00:00');
        const diaNombre = dias[dateObj.getDay()];
        const hour = parseInt(res.hora_inicio.split(':')[0]);
        const key = `${selectedSpace}-${diaNombre}-${hour}`;
        map[key] = { 
          id: res.id,
          activity: res.actividad, 
          responsible: res.nombre_responsable, 
          usuario_creador: res.usuario_creador,
          status: 'confirmed'
        };
      }
    });

    // Aplicar actualizaciones optimistas al final para que tengan prioridad sobre los datos de la DB
    Object.keys(optimisticReservations).forEach(key => {
      map[key] = optimisticReservations[key];
    });

    return map;
  }, [dbReservas, selectedSpace, currentLab, optimisticReservations]);

  // Limpiar reservas optimistas cuando los datos de la DB se sincronizan
  useEffect(() => {
    setOptimisticReservations({});
  }, [dbReservas]);

  // Efecto para scroll al inicio cuando cambia el espacio
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedSpace]);

  // Asegurar que el espacio seleccionado sea válido para el rol del usuario
  useEffect(() => {
    if (!isAdmin && !profileLoading && profile) {
      const allowedSpaces = ['agronomia', 'parcela', 'cava'];
      if (!allowedSpaces.includes(selectedSpace)) {
        setSelectedSpace('agronomia');
      }
    }
  }, [isAdmin, profile, profileLoading, selectedSpace]);

  // Verificar si las variables de entorno están configuradas
  const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-amber-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Configuración Pendiente</h2>
          <p className="text-slate-600 mb-6">
            Para que el sistema funcione, necesitas configurar las variables de Supabase en el archivo <strong>.env</strong> o en el menú de <strong>Settings</strong>.
          </p>
          <div className="text-left bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-500 mb-6">
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </div>
          <p className="text-sm text-slate-400 italic">
            Una vez configuradas, la aplicación se conectará automáticamente.
          </p>
        </div>
      </div>
    );
  }

  // Si está cargando la sesión inicial, mostrar un loader simple
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Si no hay usuario, mostrar pantalla de Login
  if (!user) {
    return <Login />;
  }

  const handleReserveClick = (key) => {
    const isReserved = !!reservations[key];

    // Restricción para usuarios normales: solo pueden agendar en Parcela
    // En Agronomía y Cava solo pueden ver lo que ya está reservado
    if (!isAdmin && selectedSpace !== 'parcela' && !isReserved) {
      return; 
    }

    // Extraer datos de la key (formato: space-dia-hora o cava-fecha-hora)
    const parts = key.split('-');
    let fecha, hora;

    if (selectedSpace === 'cava') {
      fecha = parts[1] + '-' + parts[2] + '-' + parts[3];
      hora = parts[4];
    } else {
      // Para labs normales, calculamos la fecha de la semana actual basada en el día
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaIdx = dias.indexOf(parts[1]);
      const now = new Date();
      const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const targetDate = new Date(monday.setDate(monday.getDate() + diaIdx));
      fecha = format(targetDate, 'yyyy-MM-dd');
      hora = parts[2];
    }

    setPendingReservationData({ key, fecha, hora });
    setIsModalOpen(true);
  };

  const handleConfirmReservation = async (data) => {
    if (pendingReservationData && user) {
      const existingRes = reservations[pendingReservationData.key];
      
      // Optimistic update
      setOptimisticReservations(prev => ({
        ...prev,
        [pendingReservationData.key]: {
          ...existingRes,
          activity: data.activity,
          responsible: data.responsible,
          status: 'confirmed'
        }
      }));
      setIsModalOpen(false);

      if (existingRes && existingRes.id) {
        // Update
        const { error } = await updateReserva(existingRes.id, {
          nombre_responsable: data.responsible,
          actividad: data.activity
        });
        if (error) {
          alert('Error al modificar: ' + error.message);
          setOptimisticReservations({}); // Rollback
        }
      } else {
        // Create
        const { error } = await createReserva({
          laboratorio_id: currentLab.id,
          fecha: pendingReservationData.fecha,
          hora_inicio: `${pendingReservationData.hora.padStart(2, '0')}:00:00`,
          hora_fin: `${(parseInt(pendingReservationData.hora) + 1).toString().padStart(2, '0')}:00:00`,
          nombre_responsable: data.responsible,
          actividad: data.activity,
          usuario_creador: user.id
        });
        if (error) {
          alert('Error al reservar: ' + error.message);
          setOptimisticReservations({}); // Rollback
        }
      }
      setPendingReservationData(null);
    }
  };

  const handleDeleteReservation = async () => {
    if (pendingReservationData && user) {
      const existingRes = reservations[pendingReservationData.key];
      if (existingRes && existingRes.id) {
        // Optimistic delete
        setOptimisticReservations(prev => {
          const next = { ...prev };
          delete next[pendingReservationData.key];
          return next;
        });
        setIsModalOpen(false);

        const { error } = await deleteReserva(existingRes.id);
        if (error) {
          alert('Error al eliminar: ' + error.message);
          setOptimisticReservations({}); // Rollback
        }
        setPendingReservationData(null);
      }
    }
  };

  const getSpaceTitle = () => {
    const titles = {
      minas: 'Laboratorio de Minas',
      agronomia: 'Laboratorio de Agronomía',
      construccion: 'Laboratorio de Construcción',
      robotica: 'Laboratorio de Robótica',
      parcela: 'Parcela Demostrativa',
      cava: 'Cava de Vinos'
    };
    return titles[selectedSpace] || 'Laboratorio';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Sidebar Fijo */}
      <Sidebar 
        selectedSpace={selectedSpace} 
        onSelectSpace={setSelectedSpace} 
        profile={profile}
      />

      {/* Contenido Principal */}
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header de la Vista */}
          <header className="mb-10">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest mb-2">
              <span className="w-8 h-[2px] bg-indigo-200"></span>
              Reserva de Espacios
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
              {getSpaceTitle()}
            </h1>
          </header>

          {/* Renderizado Condicional de Vistas */}
          <div className="animate-in fade-in duration-700">
            {selectedSpace === 'cava' ? (
              <CavaCalendar 
                reservations={reservations} 
                onReserve={handleReserveClick} 
              />
            ) : (
              <LabSchedule 
                spaceId={selectedSpace} 
                reservations={reservations} 
                onReserve={handleReserveClick} 
              />
            )}
          </div>

          {/* Footer Informativo */}
          <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm font-medium">
            <p>© 2026 LabReserve System. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span>Reservado</span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Modal de Formulario */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setPendingReservationData(null);
        }} 
        onConfirm={handleConfirmReservation}
        onDelete={handleDeleteReservation}
        reservation={pendingReservationData ? reservations[pendingReservationData.key] : null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
