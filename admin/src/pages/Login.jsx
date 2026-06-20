import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect immediately
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Email dan password harus diisi');
      setIsSubmitting(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Animated Lightning Bolt logo */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 text-slate-950 animate-bounce">
            <Zap className="h-10 w-10 fill-current" />
          </div>
        </div>

        <h2 className="mt-6 text-3xl font-black text-white tracking-tight">SPBKLU Admin Portal</h2>
        <p className="mt-2 text-sm text-slate-400">
          Stasiun Penukaran Baterai Kendaraan Listrik Umum
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-md py-8 px-4 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl text-rose-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spbklu.com"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  'Masuk ke Dashboard'
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Info block */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">Akun Demo Default (Admin)</h4>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold text-slate-200">admin@spbklu.com</span>
              </div>
              <div className="flex justify-between">
                <span>Password:</span>
                <span className="font-semibold text-slate-200">adminpassword</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
