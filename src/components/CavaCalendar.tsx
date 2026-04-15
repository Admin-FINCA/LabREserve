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

  const handleDateClick = (day) => {
    setSelectedDate(day);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar View */}
      <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <span className="text-sm text-slate-500 font-medium">Selecciona un día para ver horarios</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 group ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${
                  isSelected 
                    ? 'bg-[#0061ff] text-white shadow-lg shadow-blue-200' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {format(day, 'd')}
                </span>
                {isTodayDay && !isSelected && (
                  <div className="absolute bottom-2 w-1 h-1 rounded-full bg-[#0061ff]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Blocks for Selected Day */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-1">
            <CalendarIcon size={18} className="text-[#0061ff]" />
            <h3 className="font-bold text-slate-900">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-7">Horarios disponibles para reserva</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[600px]">
          {hours.map(hour => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const reservationKey = `cava-${dateStr}-${hour}`;
            const isReserved = reservations[reservationKey];
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <button
                key={hour}
                onClick={() => onReserve(reservationKey)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border group transition-transform active:scale-[0.98] ${
                  isReserved 
                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-xl shrink-0 ${isReserved ? 'bg-rose-100' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                    <Clock size={16} className={isReserved ? 'text-rose-500' : 'text-slate-500 group-hover:text-emerald-500'} />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="font-bold font-mono">{timeStr}</span>
                    {isReserved && (
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold truncate">{reservations[reservationKey].activity}</span>
                        <span className="text-[9px] font-medium opacity-70 truncate">{reservations[reservationKey].responsible}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isReserved ? 'bg-rose-200 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isReserved ? 'Reservado' : 'Disponible'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
