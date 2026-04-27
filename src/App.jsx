import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { BASE_URL } from './lib/utils.js';

import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import ClassroomView from './components/ClassroomView.jsx';
import AssignmentView from './components/AssignmentView.jsx';
import CalendarView from './components/CalendarView.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopNav from './components/TopNav.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ type: 'dashboard' });
  const [classes, setClasses] = useState([]);

  const fetchClasses = () => {
    fetch(`${BASE_URL}/api/classes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
        else console.error('Failed to fetch classes:', data);
      })
      .catch(err => console.error('Error fetching classes:', err));
  };

  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/me`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUser(data);
          fetchClasses(); // Fetch classes once user is authenticated
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
    <div className="flex flex-col min-h-screen bg-[#f8f7f2] text-stone-800">
      <TopNav user={user} fetchClasses={fetchClasses} setView={setView} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          user={user} 
          view={view} 
          setView={setView} 
          classes={classes} 
          logout={logout} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto max-h-full">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {view.type === 'dashboard' && (
                <Dashboard key="dash" user={user} setView={setView} classes={classes} fetchClasses={fetchClasses} />
              )}
              {view.type === 'class' && view.id && (
                <ClassroomView key="class" user={user} classId={view.id} setView={setView} />
              )}
              {view.type === 'assignment' && view.id && (
                <AssignmentView key="assignment" user={user} assignmentId={view.id} setView={setView} />
              )}
              {view.type === 'calendar' && (
                <CalendarView key="calendar" user={user} setView={setView} />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
