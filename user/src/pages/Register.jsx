import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(''); // 'google' or 'facebook'

  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();

  // Initialize Google SDK safely
  useEffect(() => {
    try {
      GoogleAuth.initialize({
        clientId: '58586788358-f5b1ig0vnnmp34mudo6j6ftrcmr00n0k.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true
      });
    } catch (e) {
      console.warn('GoogleAuth initialization bypassed (Web environment).');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name || !email || !password) {
      setError('Seluruh field wajib diisi');
      setIsSubmitting(false);
      return;
    }

    const result = await register(name, email, password);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  // --- SOCIAL LOGIN HANDLERS ---
  const handleGoogleSignUp = async () => {
    setError('');
    setSocialLoading('google');
    try {
      console.log('Attempting Native Google Registration...');
      
      // Call Capacitor Native Google Auth directly
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser || !googleUser.authentication || !googleUser.authentication.idToken) {
        throw new Error('Gagal menerima ID Token dari Google.');
      }

      const payload = {
        idToken: googleUser.authentication.idToken
      };

      const result = await loginWithGoogle(payload);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      // Display actual native error on screen for debugging
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(`Google OAuth Error: ${errorMessage}`);
    } finally {
      setSocialLoading('');
    }
  };

  const handleFacebookSignUp = async () => {
    setError('');
    setSocialLoading('facebook');
    try {
      const mockFacebookPayload = {
        accessToken: `mock_facebook_token_${Date.now()}`,
        email: 'budi.facebook@gmail.com',
        name: 'Budi Facebook'
      };

      const result = await loginWithFacebook(mockFacebookPayload);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Gagal mendaftar menggunakan akun Facebook.');
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6">
      {/* Brand Info */}
      <div className="text-center pt-8 space-y-3">
        <div className="flex justify-center">
          <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 p-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
            <Zap className="h-8 w-8 fill-current" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Akun</h1>
        <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto">
          Daftarkan diri Anda untuk menjadi bagian dari masa depan ekosistem kendaraan listrik.
        </p>
      </div>

      {/* Register Form Panel */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto my-6">
        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-bold">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Andi Pratama"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="andi@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Password Baru</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!socialLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 disabled:opacity-50 transition flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Daftar Sekarang'
            )}
          </button>
        </form>

        <div className="text-center mt-4 text-xs font-semibold text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-emerald-500 font-extrabold">
            Masuk Disini
          </Link>
        </div>

        {/* --- SOCIAL MEDIA REGISTER PANEL --- */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 px-3.5 text-slate-400 font-black uppercase tracking-widest text-[9px]">Atau daftar dengan</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            type="button"
            disabled={isSubmitting || !!socialLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 font-extrabold text-xs text-slate-700 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            {socialLoading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.19.57 4.37 1.7l3.26-3.26C17.65 1.63 14.98 1 12 1 7.24 1 3.16 3.73 1.13 7.72l3.86 3C5.9 8.1 8.71 5.04 12 5.04z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.42-4.93 3.42-8.55z"/>
                  <path fill="#FBBC05" d="M5.03 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.17 6.72C.42 8.3.01 10.1.01 12s.41 3.7 1.16 5.28l3.86-3z"/>
                  <path fill="#34A853" d="M12 18.96c-3.29 0-6.1-3.06-7.01-5.68l-3.86 3C3.16 20.27 7.24 23 12 23c2.98 0 5.48-.99 7.31-2.69l-3.7-2.87c-.98.66-2.25 1.52-3.61 1.52z"/>
                </svg>
                Google
              </>
            )}
          </button>

          {/* Facebook Button */}
          <button
            onClick={handleFacebookSignUp}
            type="button"
            disabled={isSubmitting || !!socialLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-750 font-extrabold text-xs text-white rounded-xl transition shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50"
          >
            {socialLoading === 'facebook' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </>
            )}
          </button>
        </div>

      </div>

      <div className="text-[10px] text-center text-slate-400 font-bold tracking-tight py-4">
        SPBKLU - Stasiun Penukaran Baterai Kendaraan Listrik Umum © 2026
      </div>
    </div>
  );
};

export default Register;
