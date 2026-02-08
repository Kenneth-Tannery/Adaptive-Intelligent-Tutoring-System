import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentModel } from '../state/studentModelContext.jsx';
import { supabase } from '../lib/supabaseClient.js';

const Login = () => {
  const { model, setStudentId } = useStudentModel();
  const [studentIdInput, setStudentIdInput] = useState(model.studentId || '');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session && model.studentId) {
      navigate('/', { replace: true });
    }
  }, [session, model.studentId, navigate]);

  const normalizeStudentId = (rawValue) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return '';
    }
    if (/^s-/i.test(trimmed)) {
      return `S-${trimmed.slice(2).trim()}`;
    }
    return `S-${trimmed}`;
  };

  const handleStudentIdOnly = () => {
    const normalized = normalizeStudentId(studentIdInput);
    if (!normalized) {
      setError('Please enter a student ID.');
      return;
    }
    setError('');
    setStudentId(normalized);
    navigate('/', { replace: true });
  };

  const formatEmailFromStudentId = (studentId) =>
    `${studentId.toLowerCase().replace(/[^a-z0-9.-]/g, '-') }@student.local`;

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const normalizedStudentId = normalizeStudentId(studentIdInput);
    if (!normalizedStudentId) {
      setError('Student ID is required.');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required.');
      setLoading(false);
      return;
    }

    const email = formatEmailFromStudentId(normalizedStudentId);

    if (!supabase?.auth) {
      setError('Auth is not configured. Check your Supabase env vars.');
      setLoading(false);
      return;
    }

    let authResponse;
    if (mode === 'signup') {
      authResponse = await supabase.auth.signUp({ email, password });
    } else {
      authResponse = await supabase.auth.signInWithPassword({ email, password });
    }

    const { error: authError } = authResponse;
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStudentId(normalizedStudentId);
    setLoading(false);
    navigate('/', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(255, 251, 235, 0.9) 0%, rgba(255, 241, 242, 0.9) 45%, rgba(238, 242, 255, 0.9) 100%)',
      }}
    >
      <div className="w-full max-w-md bg-white/90 border border-white/60 rounded-3xl shadow-2xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Student Login
        </p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          Sign in to continue
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Enter your student ID and password to access your dashboard.
        </p>

        {session ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Student ID
              </label>
              <input
                type="text"
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                placeholder="e.g. 1042"
                className="mt-2 w-full bg-white/80 border-2 border-indigo-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-medium outline-none transition-all"
              />
            </div>
            {error ? <p className="text-xs text-rose-500">{error}</p> : null}
            <button
              type="button"
              onClick={handleStudentIdOnly}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition-all"
            >
              Continue to dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Student ID
              </label>
              <input
                type="text"
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                placeholder="e.g. 1042"
                className="mt-2 w-full bg-white/80 border-2 border-indigo-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-medium outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full bg-white/80 border-2 border-indigo-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-slate-700 font-medium outline-none transition-all"
              />
            </div>
            {error ? <p className="text-xs text-rose-500">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition-all"
            >
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'))}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : 'Need an account? Create one'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
