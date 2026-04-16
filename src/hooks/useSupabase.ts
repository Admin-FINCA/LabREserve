import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper para manejar errores de Supabase
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Error en ${context}:`, error);
  return error;
};

/**
 * Hook para manejar la autenticación
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        handleSupabaseError(err, 'getSession');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Hook para obtener el perfil y rol del usuario
 */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
      handleSupabaseError(err, 'fetchProfile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { 
    profile, 
    loading, 
    error, 
    isAdmin: profile?.role === 'ADMIN',
    refresh: fetchProfile
  };
}

/**
 * Hook para obtener los laboratorios
 */
export function useLaboratorios() {
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchLabs() {
      try {
        const { data, error } = await supabase!
          .from('laboratorios')
          .select('*')
          .order('nombre');
        
        if (error) throw error;
        setLaboratorios(data || []);
      } catch (err) {
        handleSupabaseError(err, 'fetchLabs');
      } finally {
        setLoading(false);
      }
    }
    fetchLabs();
  }, []);

  return { laboratorios, loading };
}

/**
 * Hook principal para gestionar reservas con tiempo real
 */
export function useReservas(labId: string | undefined) {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservas = useCallback(async () => {
    if (!labId || !isSupabaseConfigured || !supabase) {
      setReservas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('reservas')
        .select('*')
        .eq('laboratorio_id', labId)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) throw error;
      setReservas(data || []);
    } catch (err) {
      handleSupabaseError(err, 'fetchReservas');
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    fetchReservas();

    if (!labId || !isSupabaseConfigured || !supabase) return;

    const channel = supabase!
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
      supabase!.removeChannel(channel);
    };
  }, [labId, fetchReservas]);

  const createReserva = async (reservaData: any) => {
    if (!supabase) return { error: new Error('Supabase no configurado') };
    return await supabase.from('reservas').insert([reservaData]).select();
  };

  const deleteReserva = async (id: string) => {
    if (!supabase) return { error: new Error('Supabase no configurado') };
    return await supabase.from('reservas').delete().eq('id', id);
  };

  const updateReserva = async (id: string, updateData: any) => {
    if (!supabase) return { error: new Error('Supabase no configurado') };
    return await supabase.from('reservas').update(updateData).eq('id', id).select();
  };

  return { 
    reservas, 
    loading, 
    createReserva, 
    deleteReserva, 
    updateReserva, 
    refresh: fetchReservas 
  };
}

/**
 * Hook de disponibilidad para Cava (combina bloques y reservas)
 */
export function useReservasCava(fecha: string | undefined) {
  const [disponibilidad, setDisponibilidad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCava = useCallback(async () => {
    if (!fecha || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('cava_disponibilidad')
        .select(`
          id,
          fecha,
          bloque:cava_bloques_config(*),
          reserva:reservas(*)
        `)
        .eq('fecha', fecha);

      if (error) throw error;
      setDisponibilidad(data || []);
    } catch (err) {
      handleSupabaseError(err, 'fetchCava');
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchCava();
  }, [fetchCava]);

  return { disponibilidad, loading, refresh: fetchCava };
}
