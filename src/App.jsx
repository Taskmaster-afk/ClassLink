const BASE_URL = "https://classlink-kwee.onrender.com";
import { useEffect, useState } from 'react';
import { 
  Book, 
  GraduationCap, 
  LogOut, 
  Plus, 
  Send, 
  User, 
  MessageSquare, 
  Calendar, 
  ClipboardCheck, 
  ChevronRight,
  ArrowLeft,
  Users,
  FileUp,
  FileText,
  Download,
  Library,
  FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ type: 'dashboard' });

  useEffect(() => {
    fetch("https://classlink-kwee.onrender.com/api/auth/me", {
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
    await fetch('https://classlink-kwee.onrender.com/api/auth/logout', { method: 'POST', credentials: 'include' });
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

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const endpoint = isLogin 
  ? `${BASE_URL}/api/auth/login` 
  : `${BASE_URL}/api/auth/register`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) onLogin(data);
      else setError(data.error);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex bg-emerald-900 p-12 flex-col justify-between text-white overflow-hidden relative">
        <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-900 shadow-lg">
    <Book size={28} />
  </div>
  <span className="text-2xl font-bold text-white">
    ClassLink
  </span>
</div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-4">
            A natural space for <br /> modern learning.
          </h1>
          <p className="text-emerald-300 font-medium">Join thousands of students and teachers simplifying their study workflow with ClassLink.</p>
        </div>
        
        <div className="relative z-10 flex gap-12">
          <div>
            <p className="text-4xl font-bold mb-1">10k+</p>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Active Students</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-1">98%</p>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Satisfaction Rate</p>
          </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-emerald-700 rounded-full blur-2xl opacity-20"></div>
      </div>

      <div className="flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-[#f8f7f2]">
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-3xl font-bold text-stone-800 mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="text-stone-500 mb-8">
            {isLogin ? "Enter your credentials to access your dashboard." : "Start your journey with us today."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="input w-full" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <input 
                required
                type="email" 
                className="input w-full" 
                placeholder="john@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input 
                required
                type="password" 
                className="input w-full" 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {!isLogin && (
              <div>
                <label className="label">I am a...</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                    className={cn(
                      "flex-1 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all",
                      formData.role === 'student' ? "bg-emerald-700 text-white border-emerald-700 shadow-md" : "bg-white text-stone-400 border-stone-200"
                    )}
                  >
                    Student
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'teacher' })}
                    className={cn(
                      "flex-1 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all",
                      formData.role === 'teacher' ? "bg-emerald-700 text-white border-emerald-700 shadow-md" : "bg-white text-stone-400 border-stone-200"
                    )}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
            <button type="submit" className="btn-primary w-full py-3 mt-4 text-sm uppercase tracking-widest font-bold">
              {isLogin ? 'Sign In' : 'Get Started'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-700 font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, setView }) {
  const [classes, setClasses] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [modalError, setModalError] = useState(null);

  const fetchClasses = () => {
    fetch(`${BASE_URL}/api/classes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
        else console.error('Failed to fetch classes:', data);
      })
      .catch(err => console.error('Error fetching classes:', err));
  };

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
    fetchClasses();
    fetchTodo();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/classes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setShowJoinModal(false);
        setInviteCode('');
        fetchClasses();
      } else {
        setModalError(data.error);
      }
    } catch (err) {
      setModalError("Failed to join class.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewClass({ name: '', description: '' });
        fetchClasses();
      } else {
        setModalError(data.error || "Failed to create class.");
      }
    } catch (err) {
      setModalError("Something went wrong on the server.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-stone-800">Your Classes</h3>
            {user.role === 'teacher' ? (
              <button onClick={() => { setShowCreateModal(true); setModalError(null); }} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
                <Plus size={16} /> Create Class
              </button>
            ) : (
              <button onClick={() => { setShowJoinModal(true); setModalError(null); }} className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs">
                <Plus size={16} /> Join Class
              </button>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="card p-12 text-center border-dashed bg-stone-50/50">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-300 mx-auto mb-4">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">No classes yet</h3>
              <p className="text-stone-500 mb-6 max-w-xs mx-auto text-xs">
                {user.role === 'teacher' 
                  ? "Start by creating your first class to invite students." 
                  : "Ask your teacher for a class code to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {classes.map(c => (
                <motion.div 
                  key={c.id} 
                  whileHover={{ y: -4 }}
                  onClick={() => setView({ type: 'class', id: c.id })}
                  className="card p-5 cursor-pointer hover:border-emerald-700/30 group bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-stone-100 group-hover:bg-emerald-700 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                      <Book size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1 group-hover:text-emerald-900 leading-tight">{c.name}</h3>
                  <p className="text-stone-500 text-xs line-clamp-1 mb-4">{c.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <span className="flex items-center gap-1.5 truncate pr-2">
                       {user.role === 'student' ? (c.teacher_name || 'Instructor') : 'You'}
                    </span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="card p-6 bg-white shadow-sm sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 mb-6 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-700" /> 
              {user.role === 'student' ? 'Your To-Do List' : 'Class Overview'}
            </h3>

            {user.role === 'student' ? (
              <div className="space-y-4">
                {todoList.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No pending assignments! Nice work.</p>
                ) : (
                  todoList.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => setView({ type: 'assignment', id: a.id })}
                      className="group cursor-pointer border-b border-stone-50 pb-3 last:border-0 hover:bg-stone-50 transition-colors p-2 rounded-lg -mx-2"
                    >
                      <p className="text-sm font-bold text-stone-800 group-hover:text-emerald-700 line-clamp-1">{a.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-stone-400 font-medium truncate max-w-[120px]">{a.class_name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                          {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due Date'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Total Classes</p>
                  <p className="text-3xl font-bold text-emerald-900">{classes.length}</p>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Creating a new class will generate an invite code for your students automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-sm p-8">
            <h3 className="text-2xl font-semibold mb-2">Join a class</h3>
            <p className="text-[#9e9e9e] mb-6">Enter the class code provided by your teacher.</p>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="label">Invite Code</label>
                <input 
                  required
                  type="text" 
                  className="input w-full uppercase" 
                  placeholder="X7Y2Z3"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                />
              </div>
              {modalError && <p className="text-rose-500 text-xs font-bold">{modalError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Join</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-md p-8">
            <h3 className="text-2xl font-semibold mb-2">Create new class</h3>
            <p className="text-[#9e9e9e] mb-6">Set up a space for your students to learn.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Class Name</label>
                <input 
                  required
                  type="text" 
                  className="input w-full" 
                  placeholder="Advanced Mathematics"
                  value={newClass.name}
                  onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <textarea 
                  className="input w-full h-32 resize-none" 
                  placeholder="Topics, goals, and syllabus overview..."
                  value={newClass.description}
                  onChange={e => setNewClass({ ...newClass, description: e.target.value })}
                />
              </div>
              {modalError && <p className="text-rose-500 text-xs font-bold">{modalError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ClassroomView({ user, classId, setView }) {
  const [classroom, setClassroom] = useState(null);
  const [tab, setTab] = useState('stream');
  const [resources, setResources] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', due_date: '', points: 100 });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '' });
  const [resourceFile, setResourceFile] = useState(null);

  const fetchClass = () => {
    fetch(`${BASE_URL}/api/classes/${classId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setClassroom(data);
        else console.error('Failed to fetch class:', data);
      })
      .catch(err => console.error('Error fetching class:', err));
  };

  const fetchResources = () => {
    fetch(`${BASE_URL}/api/classes/${classId}/resources`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResources(data);
      })
      .catch(err => console.error('Error fetching resources:', err));
  };

  useEffect(() => {
    fetchClass();
    fetchResources();
  }, [classId]);

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/classes/${classId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newAnnouncement }),
        credentials: 'include'
      });
      if (res.ok) {
        setNewAnnouncement('');
        fetchClass();
      } else {
        const errorData = await res.json();
        console.error('Failed to post announcement:', errorData);
      }
    } catch (err) {
      console.error('Error posting announcement:', err);
    }
  };

  const postAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', assignmentForm.title);
    formData.append('description', assignmentForm.description);
    formData.append('due_date', assignmentForm.due_date);
    formData.append('points', assignmentForm.points);
    if (assignmentFile) formData.append('file', assignmentFile);

    const res = await fetch(`${BASE_URL}/api/classes/${classId}/assignments`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (res.ok) {
      setShowAssignModal(false);
      setAssignmentForm({ title: '', description: '', due_date: '', points: 100 });
      setAssignmentFile(null);
      fetchClass();
    }
  };

  const uploadResource = async (e) => {
    e.preventDefault();
    if (!resourceFile) return;

    const formData = new FormData();
    formData.append('title', resourceForm.title);
    formData.append('description', resourceForm.description);
    formData.append('file', resourceFile);

    const res = await fetch(`${BASE_URL}/api/classes/${classId}/resources`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (res.ok) {
      setShowResourceModal(false);
      setResourceForm({ title: '', description: '' });
      setResourceFile(null);
      fetchResources();
    }
  };

  if (!classroom) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <button 
        onClick={() => setView({ type: 'dashboard' })}
        className="flex items-center gap-2 text-[#9e9e9e] hover:text-[#1a1a1a] font-medium transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="card overflow-hidden border-none shadow-md">
        <div className="bg-emerald-900 h-40 md:h-56 p-8 flex flex-col justify-end text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Book size={120} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-1">{classroom.name}</h2>
          <p className="text-emerald-300 font-medium">{classroom.teacher_name}</p>
          
          <div className="absolute top-8 right-8 bg-black/30 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md">
            <p className="text-emerald-300 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Class Code</p>
            <p className="text-xl font-mono font-bold tracking-wider text-white">{classroom.invite_code}</p>
          </div>
        </div>
        
        <div className="flex bg-white px-8">
          <button 
            onClick={() => setTab('stream')}
            className={cn(
              "px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all relative",
              tab === 'stream' ? "text-emerald-900" : "text-stone-400"
            )}
          >
            Stream
            {tab === 'stream' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setTab('assignments')}
            className={cn(
              "px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all relative",
              tab === 'assignments' ? "text-emerald-900" : "text-stone-400"
            )}
          >
            Assignments
            {tab === 'assignments' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setTab('resources')}
            className={cn(
              "px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all relative",
              tab === 'resources' ? "text-emerald-900" : "text-stone-400"
            )}
          >
            Resources
            {tab === 'resources' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700 rounded-t-full" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="card p-4">
            <h4 className="text-sm font-semibold mb-2">Upcoming</h4>
            <div className="space-y-3">
              {classroom.assignments?.slice(0, 3).map(a => (
                <div key={a.id} className="text-xs">
                  <p className="text-[#1a1a1a] font-medium line-clamp-1">{a.title}</p>
                  <p className="text-stone-400 uppercase font-bold tracking-widest text-[9px] mt-0.5">{a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No due date'}</p>
                </div>
              ))}
              {(!classroom.assignments || classroom.assignments.length === 0) && (
                <p className="text-xs text-[#9e9e9e]">No upcoming work!</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          {tab === 'stream' ? (
            <div className="space-y-4">
              <div className="card p-5 bg-white shadow-sm">
                <form onSubmit={postAnnouncement} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-700">
                    <User size={20} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea 
                      className="w-full bg-transparent border-none outline-none resize-none pt-2 text-sm text-stone-900 placeholder:text-stone-400" 
                      placeholder="Announce something to your class..."
                      rows={2}
                      value={newAnnouncement}
                      onChange={e => setNewAnnouncement(e.target.value)}
                    />
                    <div className="flex justify-end pt-2 border-t border-stone-100">
                      <button type="submit" disabled={!newAnnouncement.trim()} className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50">
                        <Send size={14} /> Post
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {classroom.announcements?.map(a => (
                  <div key={a.id} className="card p-6 flex gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold">
                      {(a.author_name || 'User').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-stone-800 text-sm">{a.author_name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-stone-900 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'assignments' ? (
            <div className="space-y-4">
              {user.role === 'teacher' && (
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="w-full card p-6 border-dashed hover:border-emerald-700 flex items-center justify-center gap-2 text-stone-400 hover:text-emerald-700 transition-all font-bold uppercase tracking-widest text-xs"
                >
                  <Plus size={20} /> Create Assignment
                </button>
              )}

              {classroom.assignments?.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => setView({ type: 'assignment', id: a.id })}
                  className="card p-6 flex items-center gap-4 cursor-pointer hover:border-emerald-700/30 group"
                >
                  <div className="w-12 h-12 bg-stone-100 group-hover:bg-emerald-700 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <ClipboardCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-800">{a.title}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Posted {new Date(a.created_at).toLocaleDateString()} • {a.points} points</p>
                  </div>
                  <ChevronRight size={20} className="text-stone-200 group-hover:text-emerald-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {user.role === 'teacher' && (
                <button 
                  onClick={() => setShowResourceModal(true)}
                  className="w-full card p-6 border-dashed hover:border-emerald-700 flex items-center justify-center gap-2 text-stone-400 hover:text-emerald-700 transition-all font-bold uppercase tracking-widest text-xs"
                >
                  <Plus size={20} /> Add Resource
                </button>
              )}

              {resources.length === 0 ? (
                <div className="card p-12 text-center border-dashed bg-stone-50/50">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-200 mx-auto mb-4">
                    <Library size={32} />
                  </div>
                  <p className="text-stone-400 text-sm">No materials uploaded yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {resources.map(r => (
                    <div key={r.id} className="card p-5 flex items-center justify-between group hover:border-emerald-700/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 group-hover:bg-emerald-700 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-800">{r.title}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Study Material • {new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a 
                        href={r.file_path} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 hover:bg-stone-50 rounded-xl transition-colors text-emerald-700"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold mb-2">Create Assignment</h3>
            <p className="text-[#9e9e9e] mb-6">Post a new task for your students to complete.</p>
            <form onSubmit={postAssignment} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required type="text" className="input w-full" placeholder="Midterm Essay" value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Detailed Instructions</label>
                <textarea className="input w-full h-32 resize-none" placeholder="Explain the requirements, resources, and evaluation criteria..." value={assignmentForm.description} onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Due Date</label>
                  <input type="datetime-local" className="input w-full" value={assignmentForm.due_date} onChange={e => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Points</label>
                  <input type="number" className="input w-full" value={assignmentForm.points} onChange={e => setAssignmentForm({ ...assignmentForm, points: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">Attachment (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-200 border-dashed rounded-2xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-stone-400" />
                      <p className="mb-2 text-sm text-stone-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-stone-400">{assignmentFile ? assignmentFile.name : 'PDF, DOCX, ZIP etc.'}</p>
                    </div>
                    <input type="file" className="hidden" onChange={e => setAssignmentFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Post Assignment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold mb-2">Upload Resource</h3>
            <p className="text-[#9e9e9e] mb-6">Share study materials, notes, or readings with your students.</p>
            <form onSubmit={uploadResource} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required type="text" className="input w-full" placeholder="Lecture Notes - Week 5" value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <textarea className="input w-full h-24 resize-none" placeholder="Brief summary of the content..." value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} />
              </div>
              <div>
                <label className="label">File</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-200 border-dashed rounded-2xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-stone-400" />
                      <p className="mb-2 text-sm text-stone-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-stone-400">{resourceFile ? resourceFile.name : 'PDF, DOCX, ZIP etc.'}</p>
                    </div>
                    <input type="file" className="hidden" onChange={e => setResourceFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowResourceModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={!resourceFile} className="btn-primary flex-1">Upload Material</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function AssignmentView({ user, assignmentId, setView }) {
  const [assignment, setAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [grading, setGrading] = useState(null);

  const fetchAssignment = () => {
    fetch(`${BASE_URL}/api/assignments/${assignmentId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setAssignment(data);
          if (data.mySubmission) setSubmissionContent(data.mySubmission.content);
        } else {
          console.error('Failed to fetch assignment:', data);
        }
      })
      .catch(err => console.error('Error fetching assignment:', err));
  };

  useEffect(() => fetchAssignment(), [assignmentId]);

  const submitWork = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', submissionContent);
    if (submissionFile) formData.append('file', submissionFile);

    const res = await fetch(`${BASE_URL}/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (res.ok) {
      setSubmissionFile(null);
      fetchAssignment();
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;
    const res = await fetch(`${BASE_URL}/api/submissions/${grading.id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: grading.grade, feedback: grading.feedback }),
      credentials: 'include'
    });
    if (res.ok) {
      setGrading(null);
      fetchAssignment();
    }
  };

  if (!assignment) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
       <button 
        onClick={() => setView({ type: 'class', id: assignment.class_id })}
        className="flex items-center gap-2 text-[#9e9e9e] hover:text-[#1a1a1a] font-medium transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Class
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">{assignment.title}</h2>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-700/50" /> Due {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No deadline'}</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-500">{assignment.points} points</span>
                </div>
              </div>
            </div>
            <div className="border-t border-stone-100 pt-6">
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap mb-6">{assignment.description || 'No instructions provided.'}</p>
              
              {assignment.file_path && (
                <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-700 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">Assignment Material</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Attached Resource</p>
                    </div>
                  </div>
                  <a 
                    href={assignment.file_path} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 hover:bg-white rounded-xl transition-colors text-emerald-700"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {user.role === 'teacher' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <Users size={18} /> Student Submissions
              </h3>
              <div className="grid gap-4">
                {assignment.submissions?.map(s => (
                  <div key={s.id} className="card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-stone-800">{s.student_name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Submitted {new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                      {s.status === 'graded' ? (
                        <div className="text-right">
                          <span className="text-lg font-bold text-emerald-700">{s.grade}</span>
                          <span className="text-sm text-stone-400"> / {assignment.points}</span>
                        </div>
                      ) : (
                        <button onClick={() => setGrading({ id: s.id, grade: assignment.points, feedback: '' })} className="btn-secondary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">Grade</button>
                      )}
                    </div>
                    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 text-sm italic text-stone-600 leading-relaxed">
                      "{s.content}"
                    </div>
                    {s.file_path && (
                      <div className="mt-3">
                        <a 
                          href={s.file_path} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
                        >
                          <Download size={14} /> View Submission File
                        </a>
                      </div>
                    )}
                    {s.feedback && (
                      <div className="mt-4 text-xs">
                        <span className="font-bold text-stone-400 uppercase tracking-widest mr-2">Feedback:</span>
                        <span className="text-stone-600">{s.feedback}</span>
                      </div>
                    )}
                  </div>
                ))}
                {(!assignment.submissions || assignment.submissions.length === 0) && (
                  <div className="card p-8 text-center text-stone-400 italic text-sm">
                    No submissions yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {user.role === 'student' && (
            <div className="card p-6 sticky top-24 bg-white border-none shadow-xl">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center justify-between uppercase tracking-widest text-xs">
                Your Work
                <span className={cn(
                  "text-[9px] uppercase px-2 py-0.5 rounded-full font-bold",
                  assignment.mySubmission?.status === 'graded' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                )}>
                  {assignment.mySubmission?.status === 'graded' ? 'Graded' : assignment.mySubmission ? 'Submitted' : 'Assigned'}
                </span>
              </h3>
              
              {assignment.mySubmission?.status === 'graded' && (
                <div className="mb-6 bg-emerald-900 text-white p-5 rounded-2xl shadow-inner">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Grade Outcome</p>
                  <p className="text-5xl font-bold">{assignment.mySubmission.grade}<span className="text-xl text-emerald-500 font-medium">/{assignment.points}</span></p>
                  {assignment.mySubmission.feedback && (
                    <p className="mt-4 text-xs italic text-emerald-200 leading-relaxed border-t border-emerald-800 pt-3">"{assignment.mySubmission.feedback}"</p>
                  )}
                </div>
              )}
              
              <form onSubmit={submitWork} className="space-y-4">
                <textarea 
                  disabled={assignment.mySubmission?.status === 'graded'}
                  className="input w-full h-48 resize-none text-sm bg-stone-50 border border-stone-100 focus:bg-white placeholder:text-stone-300" 
                  placeholder="Paste your submission content here..."
                  value={submissionContent}
                  onChange={e => setSubmissionContent(e.target.value)}
                />
                
                {assignment.mySubmission?.status !== 'graded' && (
                  <div>
                    <label className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-100 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-800">
                      <FileUp size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{submissionFile ? submissionFile.name : (assignment.mySubmission?.file_path ? 'Change Attachment' : 'Add Attachment')}</span>
                      <input type="file" className="hidden" onChange={e => setSubmissionFile(e.target.files[0])} />
                    </label>
                  </div>
                )}

                {assignment.mySubmission?.file_path && !submissionFile && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[150px]">Current: {assignment.mySubmission.file_path.split('/').pop()}</span>
                    <a href={assignment.mySubmission.file_path} target="_blank" rel="noreferrer" className="text-emerald-700"><Download size={14} /></a>
                  </div>
                )}

                <button 
                  disabled={assignment.mySubmission?.status === 'graded'}
                  type="submit" 
                  className="btn-primary w-full py-3 uppercase tracking-widest text-xs font-bold"
                >
                  {assignment.mySubmission ? 'Update Work' : 'Turn In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {grading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-sm p-8">
            <h3 className="text-2xl font-semibold mb-2">Grade Submission</h3>
            <form onSubmit={handleGrade} className="space-y-4">
              <div>
                <label className="label">Score (out of {assignment.points})</label>
                <input required type="number" max={assignment.points} className="input w-full" value={grading.grade} onChange={e => setGrading({ ...grading, grade: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="label">Feedback (Optional)</label>
                <textarea className="input w-full h-32 resize-none" placeholder="Provide notes for the student..." value={grading.feedback} onChange={e => setGrading({ ...grading, feedback: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setGrading(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit Grade</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
