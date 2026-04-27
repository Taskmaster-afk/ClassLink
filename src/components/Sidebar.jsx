import { Book, LogOut, Calendar as CalendarIcon, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ user, view, setView, classes, logout }) {
  return (
    <div className="w-64 bg-white border-r border-stone-200 flex flex-col min-h-screen sticky top-0">
      <div className="p-6 border-b border-stone-100">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setView({ type: 'dashboard' })}
        >
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-800 transition-colors">
            <Book size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-emerald-900">ClassLink</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          <button 
            onClick={() => setView({ type: 'dashboard' })}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${view.type === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          
          <button 
            onClick={() => setView({ type: 'calendar' })}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${view.type === 'calendar' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 px-4">Your Classes</h4>
          <div className="space-y-1">
            {classes.length === 0 ? (
              <p className="px-4 text-xs text-stone-400 italic">No classes yet.</p>
            ) : (
              classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setView({ type: 'class', id: c.id })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${view.type === 'class' && view.id === c.id ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${view.type === 'class' && view.id === c.id ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-400'}`}>
                    <Book size={12} />
                  </div>
                  <span className="truncate text-left flex-1">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-stone-800 line-clamp-1">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">{user.role}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-800"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
