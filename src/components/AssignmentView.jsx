import { useState, useEffect } from 'react';
import { ArrowLeft, Book, FileText, Download, Upload, ClipboardCheck, Calendar, Users, FileUp } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL, cn } from '../lib/utils.js';

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
              
              {assignment.file_path && assignment.file_path !== "null" && (
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
                   href={assignment.file_path.startsWith("http")
  ? assignment.file_path
  : `${BASE_URL}${assignment.file_path}`} 
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
                          href={s.file_path.startsWith("http") ? s.file_path : `${BASE_URL}${s.file_path}`} 
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
                    <a href={assignment.mySubmission.file_path.startsWith("http") ? assignment.mySubmission.file_path : `${BASE_URL}${assignment.mySubmission.file_path}`} target="_blank" rel="noreferrer" className="text-emerald-700"><Download size={14} /></a>
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

export default AssignmentView;
