import { useState, useEffect } from 'react';
import { Book, GraduationCap, Plus, ChevronRight, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL } from '../lib/utils.js';

export default function Dashboard({ user, setView }) {
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
