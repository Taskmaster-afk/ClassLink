import { useState, useEffect } from 'react';
import { Book, ArrowLeft, ChevronRight, User, Send, ClipboardCheck, Library, FileText, Download, Plus, FileUp } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL, cn } from '../lib/utils.js';

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

  formData.append("title", assignmentForm.title);
  formData.append("description", assignmentForm.description);

  formData.append(
    "due_date",
    assignmentForm.due_date
      ? new Date(assignmentForm.due_date).toISOString()
      : ""
  );

  formData.append("points", assignmentForm.points);

  if (assignmentFile) {
    formData.append("file", assignmentFile);
  }

  const res = await fetch(`${BASE_URL}/api/classes/${classId}/assignments`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: "Invalid server response" };
  }

  console.log("ASSIGNMENT RESPONSE:", data);

  if (!res.ok) {
    alert(data.error || "Failed to post assignment");
    return;
  }

  // ✅ SUCCESS
  setShowAssignModal(false);

  setAssignmentForm({
    title: "",
    description: "",
    due_date: "",
    points: 100
  });
  setAssignmentFile(null);

  fetchClass();
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
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : "No date"}
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Posted { a.created_at ? new Date(a.created_at).toLocaleDateString() : "No date"} • {a.points} points</p>
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
                        href={r.file_path.startsWith("http") ? r.file_path : `${BASE_URL}${r.file_path}`}
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
                  <input type="datetime-local" className="input w-full" value={assignmentForm.due_date} onChange={e => setAssignmentForm({ ...assignmentForm, due_date: e.target.value || "" })} />
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
export default ClassroomView;
