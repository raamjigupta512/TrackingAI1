
import React, { useState } from 'react';
import { useFirebase } from '../src/context/FirebaseContext';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { signInWithGoogle } = useFirebase();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google Auth login failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4 transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="p-1 w-full bg-[#73C7E6]"></div>
        <div className="p-8 pb-4">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#73C7E6] text-[#00243D] font-black px-3 py-1 text-xl rounded flex items-center gap-1.5 tracking-tight">
                <span className="text-sm">★</span>MAERSK
              </div>
              <span className="font-bold text-[#00243D] dark:text-white uppercase tracking-tighter text-sm">Global Customer Portal</span>
            </div>
            <h2 className="text-2xl font-black text-[#00243D] dark:text-white mt-4">Logistics Hub</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium italic">All the way.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 text-xs font-bold rounded-xl uppercase tracking-tight">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Real Google Sign In */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black py-4 rounded-xl transition-all shadow-md text-xs uppercase tracking-widest disabled:opacity-50 mb-6"
            id="google-signin-btn"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-b border-slate-100 dark:border-slate-800"></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">or corporate fallback</span>
            <div className="flex-1 border-b border-slate-100 dark:border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Corporate Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] transition-all font-bold text-xs"
                placeholder="logistics.manager@maersk.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-[#00243D] dark:bg-[#73C7E6] hover:bg-[#001020] dark:hover:bg-[#5bb2cf] text-white dark:text-[#00243D] font-black py-4 rounded-xl shadow-xl shadow-sky-500/10 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white dark:border-[#00243D] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            Corporate Account? <span className="text-[#008294] dark:text-[#73C7E6] font-black">Google Sign-In Synchronizes Cloud Data</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
