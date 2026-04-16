import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, ClipboardList, Trash2, Save } from 'lucide-react';

export default function Modal({ isOpen, onClose, onConfirm, onDelete, reservation, isAdmin }) {
  const [activity, setActivity] = useState('');
  const [responsible, setResponsible] = useState('');
  const isEditing = !!reservation;

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        setActivity(reservation.activity || '');
        setResponsible(reservation.responsible || '');
      } else {
        setActivity('');
        setResponsible('');
      }
    }
  }, [isOpen, reservation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activity.trim() && responsible.trim()) {
      onConfirm({ activity: activity.trim(), responsible: responsible.trim() });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-lg w-full overflow-hidden border border-white"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600" />
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {isEditing ? 'Detalles de Reserva' : 'Nueva Reserva'}
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Completa los campos requeridos</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-10">
                <div className="relative group">
                  <label className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 ml-1">
                    <ClipboardList size={14} />
                    Actividad / Clase
                  </label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    disabled={isEditing && !isAdmin}
                    className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300 disabled:opacity-50"
                    placeholder="Ej: Análisis de Suelos"
                    required
                  />
                </div>

                <div className="relative group">
                  <label className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 ml-1">
                    <User size={14} />
                    Docente Responsable
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    disabled={isEditing && !isAdmin}
                    className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300 disabled:opacity-50"
                    placeholder="Ej: Ing. Pedro Picapiedra"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 gap-4">
                {(!isEditing || isAdmin) && (
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {isEditing ? <Save size={18} /> : null}
                    {isEditing ? 'Guardar Cambios' : 'Agendar Ahora'}
                  </button>
                )}

                {isEditing && isAdmin && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="w-full bg-white text-rose-500 border-2 border-rose-50 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Trash2 size={18} />
                    Eliminar Permanente
                  </button>
                )}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Cancelar y Volver
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
