import React from 'react';
import { Clock } from 'lucide-react';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export default function LabSchedule({ spaceId, reservations, onReserve }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-left w-24">
                <div className="flex items-center gap-2 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <Clock size={14} />
                  Hora
                </div>
              </th>
              {days.map(day => (
                <th key={day} className="p-4 text-center border-l border-slate-100">
                  <span className="text-slate-900 font-bold">{day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <tr key={hour} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-500 font-mono text-sm font-medium">
                    {timeStr}
                  </td>
                  {days.map(day => {
                    const reservationKey = `${spaceId}-${day}-${hour}`;
                    const reservation = reservations[reservationKey];
                    const isReserved = !!reservation;
                    
                    return (
                      <td key={day} className="p-1 border-l border-slate-100 h-20">
                        <button
                          onClick={() => !isReserved && onReserve(reservationKey)}
                          disabled={isReserved}
                          className={`w-full h-full rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 group relative overflow-hidden p-2 ${
                            isReserved 
                              ? 'bg-rose-50 text-rose-600 cursor-not-allowed border border-rose-100' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 cursor-pointer'
                          }`}
                        >
                          {isReserved ? (
                            <div className="flex flex-col items-center text-center w-full">
                              <span className="text-[11px] font-bold leading-tight truncate w-full">
                                {reservation.activity}
                              </span>
                              <span className="text-[9px] font-medium opacity-70 truncate w-full">
                                {reservation.responsible}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">
                                Disponible
                              </span>
                            </>
                          )}
                          
                          {!isReserved && (
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
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
