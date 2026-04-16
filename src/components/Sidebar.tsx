import React from 'react';
import { 
  Beaker, 
  Sprout, 
  Hammer, 
  Cpu, 
  Map, 
  Wine,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const spaces = [
  { id: 'minas', name: 'Minas', icon: Beaker },
  { id: 'agronomia', name: 'Agronomía', icon: Sprout },
  { id: 'construccion', name: 'Construcción', icon: Hammer },
  { id: 'robotica', name: 'Robótica', icon: Cpu },
  { id: 'parcela', name: 'Parcela Demostrativa', icon: Map },
  { id: 'cava', name: 'Cava de Vinos', icon: Wine },
];

export default function Sidebar({ selectedSpace, onSelectSpace, profile }) {
  const isAdmin = profile?.role === 'ADMIN';
  const userInitials = profile?.full_name 
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const visibleSpaces = isAdmin 
    ? spaces 
    : spaces.filter(s => ['agronomia', 'parcela', 'cava'].includes(s.id));

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-white text-slate-600 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.01)] z-40">
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
            <Beaker size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none">
              LabReserve
            </h1>
            <span className="text-[10px] items-center gap-2 text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">
              Plataforma
            </span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          Espacios Disponibles
        </p>
        {visibleSpaces.map((space) => {
          const Icon = space.icon;
          const isActive = selectedSpace === space.id;
          
          return (
            <button
              key={space.id}
              onClick={() => onSelectSpace(space.id)}
              className={`w-full flex items-center justify-start px-4 py-4 rounded-2xl transition-all duration-300 group relative border-2 ${
                isActive 
                  ? 'bg-indigo-50/50 border-indigo-100/50 text-indigo-700' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-4 w-full">
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-white'}`}>
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                </div>
                <span className="font-bold text-sm tracking-tight truncate">{space.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="bg-slate-50/80 rounded-[2rem] p-4 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 text-lg font-black">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">
                {profile?.full_name || 'Cargando...'}
              </span>
              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">
                {profile?.role === 'ADMIN' ? 'Administrador' : 'Investigador'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-slate-200 text-rose-500 font-bold text-xs hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all active:scale-[0.98] shadow-sm"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
