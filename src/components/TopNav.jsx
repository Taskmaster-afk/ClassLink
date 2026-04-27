import { useState } from 'react';
import { Book, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL } from '../lib/utils.js';

export default function TopNav({ user, fetchClasses, setView }) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [modalError, setModalError] = useState(null);

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
    <nav className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-8">
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
      
      <div className="flex items-center gap-4">
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

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-sm p-8 bg-white shadow-xl">
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
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card w-full max-w-md p-8 bg-white shadow-xl">
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
    </nav>
  );
}
