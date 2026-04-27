import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'motion/react';
import { ChevronRight, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { BASE_URL } from '../lib/utils.js';

export default function CalendarView({ user, setView }) {
  const [todoList, setTodoList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchTodo = () => {
    if (user.role === 'student') {
      fetch(`${BASE_URL}/api/student/assignments`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTodoList(data);
        })
        .catch(err => console.error('Error fetching todo:', err));
    }
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  const filteredTodoList = todoList.filter(a => {
    if (!a.due_date) return false;
    const dueDate = new Date(a.due_date);
    return dueDate.getFullYear() === selectedDate.getFullYear() &&
           dueDate.getMonth() === selectedDate.getMonth() &&
           dueDate.getDate() === selectedDate.getDate();
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button 
        onClick={() => setView({ type: 'dashboard' })}
        className="flex items-center gap-2 text-[#9e9e9e] hover:text-[#1a1a1a] font-medium transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-stone-800 tracking-tight">Assignment Calendar</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-6 bg-white shadow-sm overflow-hidden">
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate} 
              className="w-full border-none font-sans text-sm calendar-lg"
              tileClassName={({ date, view }) => {
                // Highlight dates that have assignments due
                if (view === 'month') {
                  const hasAssignment = todoList.some(a => {
                    if (!a.due_date) return false;
                    const d = new Date(a.due_date);
                    return d.getFullYear() === date.getFullYear() &&
                           d.getMonth() === date.getMonth() &&
                           d.getDate() === date.getDate();
                  });
                  return hasAssignment ? 'has-assignment' : null;
                }
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 bg-white shadow-sm sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 mb-6 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-700" /> 
              Due on {selectedDate.toLocaleDateString()}
            </h3>

            {user.role === 'student' ? (
              <div className="space-y-4">
                {filteredTodoList.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No assignments due on this date. Take a break!</p>
                ) : (
                  filteredTodoList.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => setView({ type: 'assignment', id: a.id })}
                      className="group cursor-pointer border-b border-stone-50 pb-3 last:border-0 hover:bg-stone-50 transition-colors p-2 rounded-lg -mx-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-800 group-hover:text-emerald-700 line-clamp-1">{a.title}</p>
                        <span className="text-[10px] text-stone-400 font-medium truncate max-w-[120px]">{a.class_name}</span>
                      </div>
                      <ChevronRight size={14} className="text-stone-300 group-hover:text-emerald-700 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  The calendar view is currently only available for students to track their upcoming due dates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
