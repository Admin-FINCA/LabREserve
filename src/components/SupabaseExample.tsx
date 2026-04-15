import React from 'react';
import { useAuth, useProfile, useReservas } from '../hooks/useSupabase';

export default function SupabaseExample({ labId }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isAdmin, loading: profileLoading } = useProfile(user?.id);
  const { reservas, createReserva, deleteReserva, loading: resLoading } = useReservas(labId);

  if (authLoading || profileLoading) return <p>Cargando sesión...</p>;
  if (!user) return <p>Por favor, inicia sesión.</p>;

  const handleNewReserva = async () => {
    const { error } = await createReserva({
      laboratorio_id: labId,
      fecha: '2026-04-20',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      nombre_responsable: profile.full_name,
      actividad: 'Práctica de Laboratorio',
      usuario_creador: user.id
    });

    if (error) alert('Error: ' + error.message);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Gestión de Reservas</h2>
      <p className="mb-4">Usuario: {profile?.full_name} ({profile?.role})</p>

      {/* Lógica de botones según RLS y Rol */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleNewReserva}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nueva Reserva
        </button>
      </div>

      <ul className="space-y-2">
        {reservas.map(res => (
          <li key={res.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
            <span>{res.actividad} - {res.hora_inicio}</span>
            
            {/* Solo Admin puede borrar cualquier cosa, o el RLS lo bloqueará si no es permitido */}
            {(isAdmin || res.usuario_creador === user.id) && (
              <button 
                onClick={() => deleteReserva(res.id)}
                className="text-red-600 hover:text-red-800 text-sm font-bold"
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
