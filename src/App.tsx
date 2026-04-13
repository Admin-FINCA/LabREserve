/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LabSchedule from './components/LabSchedule';
import CavaCalendar from './components/CavaCalendar';
import Modal from './components/Modal';
import { format } from 'date-fns';

// Mock inicial de datos
const INITIAL_RESERVATIONS = {
  'minas-Lunes-9': { activity: 'Extracción de Minerales', responsible: 'Ing. Carlos Ruiz' },
  'minas-Lunes-10': { activity: 'Análisis de Suelos', responsible: 'Dra. Elena Torres' },
  'robotica-Miércoles-14': { activity: 'Taller de Drones', responsible: 'Prof. Marco Polo' },
  'robotica-Miércoles-15': { activity: 'Programación PLC', responsible: 'Ing. Sofía Lara' },
  [`cava-${format(new Date(), 'yyyy-MM-dd')}-10`]: { activity: 'Cata de Tintos', responsible: 'Sommelier Luis V.' },
  [`cava-${format(new Date(), 'yyyy-MM-dd')}-11`]: { activity: 'Maridaje Quesos', responsible: 'Chef Ana M.' },
};

export default function App() {
  const [selectedSpace, setSelectedSpace] = useState('minas');
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingReservationKey, setPendingReservationKey] = useState(null);

  // Efecto para scroll al inicio cuando cambia el espacio
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedSpace]);

  const handleReserveClick = (key) => {
    setPendingReservationKey(key);
    setIsModalOpen(true);
  };

  const handleConfirmReservation = (data) => {
    if (pendingReservationKey) {
      setReservations(prev => ({
        ...prev,
        [pendingReservationKey]: data
      }));
      setIsModalOpen(false);
      setPendingReservationKey(null);
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
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmReservation}
      />
    </div>
  );
}
