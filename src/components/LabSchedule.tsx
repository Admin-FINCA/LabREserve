import React from 'react';
import { Clock } from 'lucide-react';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export default function LabSchedule({ spaceId, reservations, onReserve }) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-left w-32 border-r border-slate-100/50">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                  <Clock size={14} />
                  Horario
                </div>
              </th>
              {days.map(day => (
                <th key={day} className="p-6 text-center border-l border-slate-100/50">
                  <span className="text-slate-800 font-black text-sm uppercase tracking-tight">{day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <tr key={hour} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <td className="p-6 text-slate-400 font-mono text-xs font-black border-r border-slate-100/50 text-center">
                    {timeStr}
                  </td>
                  {days.map(day => {
                    const reservationKey = `${spaceId}-${day}-${hour}`;
                    const reservation = reservations[reservationKey];
                    const isReserved = !!reservation;
                    
                    return (
                      <td key={day} className="p-2 border-l border-slate-100/50 h-28 min-w-[140px]">
                        <button
                          onClick={() => onReserve(reservationKey)}
                          className={`w-full h-full rounded-2xl flex flex-col items-center justify-center gap-2 group/btn relative overflow-hidden p-3 transition-all duration-300 border-2 active:scale-[0.97] ${
                            isReserved 
                              ? 'bg-rose-50/30 text-rose-600 border-rose-100/50 hover:bg-rose-50 hover:border-rose-200' 
                              : 'bg-emerald-50/20 hover:bg-emerald-50 text-emerald-600 border-emerald-50/50 hover:border-emerald-100 cursor-pointer'
                          }`}
                        >
                          {isReserved ? (
                            <div className="flex flex-col items-center text-center w-full z-10 animate-in fade-in zoom-in-95">
                              <span className="text-xs font-black leading-tight mb-1 line-clamp-2">
                                {reservation.activity}
                              </span>
                              <div className="flex items-center gap-1 opacity-60">
                                <span className="text-[9px] font-black uppercase tracking-wider truncate">
                                  {reservation.responsible}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 z-10 opacity-40 group-hover/btn:opacity-100 transition-opacity">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                              <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                                Libre
                              </span>
                            </div>
                          )}
                          
                          {!isReserved && (
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover/btn:bg-emerald-500/[0.02] transition-colors" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
