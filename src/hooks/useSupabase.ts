import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para manejar la autenticación
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Hook para obtener el perfil y rol del usuario
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  return { profile, loading, error, isAdmin: profile?.role === 'ADMIN' };
}

/**
 * Hook para obtener los laboratorios
 */
export function useLaboratorios() {
  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLabs() {
      const { data } = await supabase.from('laboratorios').select('*');
      setLaboratorios(data || []);
      setLoading(false);
    }
    fetchLabs();
  }, []);

  return { laboratorios, loading };
}

/**
 * Hook para gestionar reservas estándar con suscripción en tiempo real
 */
export function useReservas(labId) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchReservas() {
    if (!labId) {
      setReservas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('reservas')
      .select('*')
      .eq('laboratorio_id', labId)
      .order('fecha', { ascending: true });
    setReservas(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchReservas();

    if (!labId) return;

    // Suscripción en tiempo real
    const channel = supabase
      .channel(`reservas_lab_${labId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `laboratorio_id=eq.${labId}`
        },
        () => {
          fetchReservas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [labId]);

  async function createReserva(reservaData) {
    const { data, error } = await supabase
      .from('reservas')
      .insert([reservaData])
      .select();
    return { data, error };
  }

  async function deleteReserva(id) {
    const { error } = await supabase.from('reservas').delete().eq('id', id);
    return { error };
  }

  async function updateReserva(id, updateData) {
    const { data, error } = await supabase
      .from('reservas')
      .update(updateData)
      .eq('id', id)
      .select();
    return { data, error };
  }

  return { reservas, loading, createReserva, deleteReserva, updateReserva, refresh: fetchReservas };
}

/**
 * Hook específico para la Cava
 */
export function useReservasCava(fecha) {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchCava() {
    if (!fecha) return;
    setLoading(true);
    
    // Obtenemos bloques y su estado de reserva para la fecha
    const { data, error } = await supabase
      .from('cava_disponibilidad')
      .select(`
        id,
        fecha,
        bloque:cava_bloques_config(*),
        reserva:reservas(*)
      `)
      .eq('fecha', fecha);

    setDisponibilidad(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCava();
  }, [fecha]);

  return { disponibilidad, loading, refresh: fetchCava };
}
