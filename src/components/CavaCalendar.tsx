import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export default function CavaCalendar({ reservations, onReserve }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const handleDateClick = (day: Date) => {
    setSelectedDate(startOfDay(day));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Calendar View */}
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-slate-900 capitalize tracking-tighter">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Disponibilidad Mensual</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={prevMonth}
              className="p-3 hover:bg-slate-50 rounded-2xl border-2 border-slate-50 transition-all hover:border-slate-100 text-slate-500 hover:text-indigo-600 active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-3 hover:bg-slate-50 rounded-2xl border-2 border-slate-50 transition-all hover:border-slate-100 text-slate-500 hover:text-indigo-600 active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3 mb-6">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`relative aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-300 group border-2 ${
                  !isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
                } ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 z-10' 
                    : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`text-xl font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {format(day, 'd')}
                </span>
                {isTodayDay && !isSelected && (
                  <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Blocks for Selected Day */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
              <CalendarIcon size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight capitalize leading-tight">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-14">Horarios disponibles</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[600px] custom-scrollbar">
          {hours.map(hour => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const reservationKey = `cava-${dateStr}-${hour}`;
            const reservation = reservations[reservationKey];
            const isReserved = !!reservation;
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <button
                key={hour}
                onClick={() => onReserve(reservationKey)}
                className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-300 group active:scale-[0.98] ${
                  isReserved 
                    ? 'bg-rose-50/40 border-rose-100/50 text-rose-600' 
                    : 'bg-white border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-3 rounded-2xl transition-all ${isReserved ? 'bg-rose-100/50' : 'bg-slate-50 group-hover:bg-emerald-100/50'}`}>
                    <Clock size={18} className={isReserved ? 'text-rose-500' : 'text-slate-400 group-hover:text-emerald-500'} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">{timeStr}</span>
                    {isReserved && (
                      <div className="flex flex-col mt-0.5 animate-in slide-in-from-left-2">
                        <span className="text-[11px] font-black leading-none truncate text-rose-500">{reservation.activity}</span>
                        <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider truncate mt-1">{reservation.responsible}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shrink-0 border ${
                  isReserved ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700 transition-all opacity-0 group-hover:opacity-100'
                }`}>
                  {isReserved ? 'Reservado' : 'Reservar'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
