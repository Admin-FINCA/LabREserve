import React from 'react';
import { 
  Beaker, 
  Sprout, 
  Hammer, 
  Cpu, 
  Map, 
  Wine,
  ChevronRight
} from 'lucide-react';

const spaces = [
  { id: 'minas', name: 'Minas', icon: Beaker },
  { id: 'agronomia', name: 'Agronomía', icon: Sprout },
  { id: 'construccion', name: 'Construcción', icon: Hammer },
  { id: 'robotica', name: 'Robótica', icon: Cpu },
  { id: 'parcela', name: 'Parcela Demostrativa', icon: Map },
  { id: 'cava', name: 'Cava de Vinos', icon: Wine },
];

export default function Sidebar({ selectedSpace, onSelectSpace }) {
  return (
    <aside className="w-64 bg-white text-slate-600 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Beaker size={20} />
          </div>
          Laboratorio
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {spaces.map((space) => {
          const Icon = space.icon;
          const isActive = selectedSpace === space.id;
          
          return (
            <button
              key={space.id}
              onClick={() => onSelectSpace(space.id)}
              className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 group whitespace-nowrap overflow-hidden border ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border-indigo-100/50' 
                  : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="font-semibold truncate tracking-tight">{space.name}</span>
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-50 mt-auto bg-slate-50/30">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black">
            GM
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800">G. Moscoso</span>
            <span className="text-[10px] text-indigo-500 uppercase tracking-[0.2em] font-black">Administrador</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
