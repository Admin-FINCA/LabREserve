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
import { format, startOfWeek, addDays } from 'date-fns';
import { useAuth, useProfile, useLaboratorios, useReservas } from './hooks/useSupabase';
import { isSupabaseConfigured } from './lib/supabase';

// Nombres de los días en español para mapeo interno
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function App() {
  const [selectedSpace, setSelectedSpace] = useState('agronomia');
  const { user, loading: authLoading } = useAuth();
  const { profile, isAdmin, loading: profileLoading } = useProfile(user?.id);
  const { laboratorios } = useLaboratorios();
  
  // Laboratorio seleccionado actualmente
  const currentLab = useMemo(() => 
    laboratorios.find(l => l.slug === selectedSpace),
    [laboratorios, selectedSpace]
  );

  const { 
    reservas: dbReservas, 
    createReserva, 
    updateReserva, 
    deleteReserva, 
    loading: resLoading 
  } = useReservas(currentLab?.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingReservationData, setPendingReservationData] = useState<any>(null);
  const [optimisticReservations, setOptimisticReservations] = useState<any>({});

  // Mapear reservas de la DB al formato que esperan los componentes visuales
  const reservationsMap = useMemo(() => {
    const map: any = {};
    
    dbReservas.forEach(res => {
      let key = '';
      if (currentLab?.es_cava) {
        const hour = parseInt(res.hora_inicio.split(':')[0]);
        key = `cava-${res.fecha}-${hour}`;
      } else {
        // Para laboratorios semanales, determinamos el día de la semana
        const dateObj = new Date(res.fecha + 'T12:00:00');
        const diaIdx = (dateObj.getDay() + 6) % 7; // Ajuste para que Lunes sea 0
        const diaNombre = DIAS_SEMANA[diaIdx];
        const hour = parseInt(res.hora_inicio.split(':')[0]);
        key = `${selectedSpace}-${diaNombre}-${hour}`;
      }

      map[key] = { 
        id: res.id,
        activity: res.actividad, 
        responsible: res.nombre_responsable, 
        usuario_creador: res.usuario_creador
      };
    });

    // Sobrescribir con estados optimistas (creación/edición inmediata)
    return { ...map, ...optimisticReservations };
  }, [dbReservas, selectedSpace, currentLab, optimisticReservations]);

  // Limpiar estado optimista cuando cambian los datos reales (sincronización)
  useEffect(() => {
    setOptimisticReservations({});
  }, [dbReservas]);

  // Reset de scroll al cambiar de vista
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedSpace]);

  // Seguridad: Validar acceso del usuario al espacio seleccionado
  useEffect(() => {
    if (!isAdmin && !profileLoading && profile) {
      const allowed = ['agronomia', 'parcela', 'cava'];
      if (!allowed.includes(selectedSpace)) {
        setSelectedSpace('agronomia');
      }
    }
  }, [isAdmin, profile, profileLoading, selectedSpace]);

  // --- Manejadores de Eventos ---

  const handleCellClick = (key: string) => {
    const isReserved = !!reservationsMap[key];

    // Regla de negocio: No-admins solo pueden crear en Parcela
    if (!isAdmin && selectedSpace !== 'parcela' && !isReserved) {
      return; 
    }

    // Calcular fecha y hora a partir de la llave
    const parts = key.split('-');
    let fecha = '';
    let hora = '';

    if (selectedSpace === 'cava') {
      fecha = `${parts[1]}-${parts[2]}-${parts[3]}`; // cava-YYYY-MM-DD-HH
      hora = parts[4];
    } else {
      // Para labs semanales, calculamos la fecha real de "esta semana"
      const diaIdx = DIAS_SEMANA.indexOf(parts[1]);
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const targetDate = addDays(startOfCurrentWeek, diaIdx);
      fecha = format(targetDate, 'yyyy-MM-dd');
      hora = parts[2];
    }

    setPendingReservationData({ key, fecha, hora });
    setIsModalOpen(true);
  };

  const onConfirm = async (data: { activity: string, responsible: string }) => {
    if (!pendingReservationData || !user || !currentLab) return;

    const existing = reservationsMap[pendingReservationData.key];
    
    // Actualización Optimista
    setOptimisticReservations((prev: any) => ({
      ...prev,
      [pendingReservationData.key]: {
        ...existing,
        activity: data.activity,
        responsible: data.responsible
      }
    }));
    setIsModalOpen(false);

    try {
      if (existing?.id) {
        // UPDATE
        const { error } = await updateReserva(existing.id, {
          nombre_responsable: data.responsible,
          actividad: data.activity
        });
        if (error) throw error;
      } else {
        // CREATE
        const hIni = parseInt(pendingReservationData.hora);
        const { error } = await createReserva({
          laboratorio_id: currentLab.id,
          fecha: pendingReservationData.fecha,
          hora_inicio: `${hIni.toString().padStart(2, '0')}:00:00`,
          hora_fin: `${(hIni + 1).toString().padStart(2, '0')}:00:00`,
          nombre_responsable: data.responsible,
          actividad: data.activity,
          usuario_creador: user.id
        });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(`Error en la operación: ${err.message}`);
      setOptimisticReservations({}); // Rollback en caso de error
    } finally {
      setPendingReservationData(null);
    }
  };

  const onDelete = async () => {
    const existing = pendingReservationData ? reservationsMap[pendingReservationData.key] : null;
    if (!existing?.id) return;

    if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;

    // Delete Optimista
    setOptimisticReservations((prev: any) => {
      const next = { ...prev };
      delete next[pendingReservationData.key];
      return next;
    });
    setIsModalOpen(false);

    try {
      const { error } = await deleteReserva(existing.id);
      if (error) throw error;
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
      setOptimisticReservations({}); // Rollback
    } finally {
      setPendingReservationData(null);
    }
  };

  // --- Renderizado de Estados de Carga / Error ---

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-amber-100">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Configuración Necesaria</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            El sistema requiere las claves de acceso a Supabase para funcionar. Por favor, configúralas en el archivo <strong>.env</strong>.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl text-[10px] font-mono text-slate-400 text-left border border-slate-100">
            VITE_SUPABASE_URL<br/>VITE_SUPABASE_ANON_KEY
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-slate-400 font-bold text-sm animate-pulse tracking-widest uppercase">Iniciando Sistema</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar 
        selectedSpace={selectedSpace} 
        onSelectSpace={setSelectedSpace} 
        profile={profile}
      />

      <main className="flex-1 ml-64 p-8 lg:p-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 relative">
            <div className="absolute -left-6 -top-2 w-12 h-12 bg-white/50 rounded-full blur-2xl -z-10" />
            <div className="flex items-center gap-3 text-indigo-500 font-black text-xs uppercase tracking-[0.2em] mb-3">
              <span className="w-10 h-[3px] bg-indigo-500 rounded-full"></span>
              Panel de Reservas
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-2">
              {currentLab?.nombre || 'Laboratorio'}
            </h1>
            <p className="text-slate-400 font-medium">Gestión horaria y disponibilidad en tiempo real.</p>
          </header>

          <div className="transition-all duration-500 ease-in-out">
            {selectedSpace === 'cava' ? (
              <CavaCalendar 
                reservations={reservationsMap} 
                onReserve={handleCellClick} 
              />
            ) : (
              <LabSchedule 
                spaceId={selectedSpace} 
                reservations={reservationsMap} 
                onReserve={handleCellClick} 
              />
            )}
          </div>

          <footer className="mt-20 pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <p className="opacity-60 italic">© 2026 LabReserve | UVM Labs Platform</p>
            <div className="flex gap-8">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-200"></div>
                <span>Reservado</span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={onConfirm}
        onDelete={onDelete}
        reservation={pendingReservationData ? reservationsMap[pendingReservationData.key] : null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
