import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ open, initialMode = 'login', onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-sync to whichever mode the caller asked for (e.g. Header's
  // "Sign In" vs "Register" buttons, or the landing page's CTAs)
  // every time the modal is (re)opened.
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  if (!open) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRole('USER');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
      resetForm();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cardBg border border-[#242733] rounded-md w-full max-w-[420px] p-6 text-white">
        <div className="font-headline text-lg font-bold text-white mb-3">
          APEX<span className="text-gold">MOTORS</span>
        </div>
        <h3 className="font-headline text-xl uppercase mb-1">{mode === 'login' ? 'Sign In' : 'Create Account'}</h3>
        <p className="text-xs text-slate-400 mb-4">
          {mode === 'login'
            ? 'Welcome back. Sign in and we\'ll take you straight to your portal.'
            : 'Tell us which portal you need — every new account lands there automatically.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block font-medium">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1c1e26] rounded px-2.5 py-2 text-xs text-slate-50 outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block font-medium">I am registering as</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`text-left px-3 py-2.5 rounded border text-xs font-medium transition-colors ${
                    role === 'USER' ? 'border-gold bg-[#1a1710] text-gold' : 'border-[#1c1e26] text-slate-400'
                  }`}
                >
                  <div className="font-bold uppercase tracking-wide mb-0.5">Customer</div>
                  <div className="text-[10px] text-slate-500">Browse &amp; order vehicles</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`text-left px-3 py-2.5 rounded border text-xs font-medium transition-colors ${
                    role === 'ADMIN' ? 'border-gold bg-[#1a1710] text-gold' : 'border-[#1c1e26] text-slate-400'
                  }`}
                >
                  <div className="font-bold uppercase tracking-wide mb-0.5">Admin</div>
                  <div className="text-[10px] text-slate-500">Manage inventory &amp; orders</div>
                </button>
              </div>
            </div>
          )}

          {error && <div className="text-rose text-xs bg-[#241315] border border-[#421d21] rounded p-2">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gold hover:bg-goldHover text-black text-xs font-bold uppercase rounded mt-1 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="mt-3 text-slate-500 text-xs w-full text-center"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>

        <button
          type="button"
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="mt-2 text-slate-500 text-xs w-full text-center"
        >
          Cancel
        </button>

        <div className="mt-4 pt-3 border-t border-[#1c1e26] text-[10px] text-slate-500 leading-relaxed">
          Demo accounts (after running the seed script): <br />
          admin@apexmotors.com / Admin123! · customer@apexmotors.com / Customer123!
        </div>
      </div>
    </div>
  );
}
