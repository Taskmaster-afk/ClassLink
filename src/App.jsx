import { useEffect, useState } from 'react';
import { Book, LogOut } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { BASE_URL } from './lib/utils.js';

import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import ClassroomView from './components/ClassroomView.jsx';
import AssignmentView from './components/AssignmentView.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ type: 'dashboard' });

  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/me`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUser(data);
        } else {
          setUser(null);
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setView({ type: 'dashboard' });
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-[#f8f7f2]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-400 font-medium font-sans">Loading ClassLink...</p>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#f8f7f2] pb-20 text-stone-800">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setView({ type: 'dashboard' })}
        >
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white">
            <Book size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-emerald-900">ClassLink</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-stone-800">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 leading-none">{user.role}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-stone-50 rounded-xl transition-colors text-stone-400 hover:text-stone-800"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {view.type === 'dashboard' && (
            <Dashboard key="dash" user={user} setView={setView} />
          )}
          {view.type === 'class' && view.id && (
            <ClassroomView key="class" user={user} classId={view.id} setView={setView} />
          )}
          {view.type === 'assignment' && view.id && (
            <AssignmentView key="assignment" user={user} assignmentId={view.id} setView={setView} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
