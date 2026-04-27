import { useState } from 'react';
import { Book } from 'lucide-react';
import { BASE_URL, cn } from '../lib/utils.js';

export default function AuthPage({ onLogin }) {
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
