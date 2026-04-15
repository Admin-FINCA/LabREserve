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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activity && responsible) {
      onConfirm({ activity, responsible });
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
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-400" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {isEditing ? 'Información de Reserva' : 'Nueva Reserva'}
              </h2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                  <ClipboardList size={16} className="text-indigo-400" />
                  Nombre de actividad
                </label>
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  disabled={isEditing && !isAdmin}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 outline-none transition-all bg-slate-50/50 disabled:opacity-70"
                  placeholder="Ej: Clase de Química I"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                  <User size={16} className="text-indigo-400" />
                  Responsable
                </label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  disabled={isEditing && !isAdmin}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 outline-none transition-all bg-slate-50/50 disabled:opacity-70"
                  placeholder="Ej: Dr. Juan Pérez"
                  required
                />
              </div>

              <div className="pt-4 space-y-3">
                {(!isEditing || isAdmin) && (
                  <button
                    type="submit"
                    className="w-full bg-indigo-400 text-white py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isEditing ? <Save size={20} /> : null}
                    {isEditing ? 'Modificar Reserva' : 'Confirmar Reserva'}
                  </button>
                )}

                {isEditing && isAdmin && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold hover:bg-rose-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    Eliminar Reserva
                  </button>
                )}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    Cancelar
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
