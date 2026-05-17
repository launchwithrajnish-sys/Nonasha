import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Github, Chrome, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 md:top-8 md:right-8 text-neutral-300 hover:text-brand-dark transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 md:p-12 overflow-y-auto">
              <div className="flex items-center gap-3 mb-8 md:mb-10">
                <div className="w-10 h-10 bg-brand-leaf/10 rounded-2xl flex items-center justify-center text-brand-leaf shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-brand-dark leading-tight">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-[9px] md:text-[10px] font-black text-brand-dark/30 uppercase tracking-[0.2em]">Nonasha Recovery Network</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 md:mb-8 p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4 md:space-y-6">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-neutral-50 border border-neutral-100 p-4 md:p-6 pl-14 md:pl-16 rounded-2xl md:rounded-3xl font-bold focus:outline-none focus:border-brand-leaf/40 transition-all text-sm md:text-base"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-neutral-50 border border-neutral-100 p-4 md:p-6 pl-14 md:pl-16 rounded-2xl md:rounded-3xl font-bold focus:outline-none focus:border-brand-leaf/40 transition-all text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-100 p-4 md:p-6 pl-14 md:pl-16 rounded-2xl md:rounded-3xl font-bold focus:outline-none focus:border-brand-leaf/40 transition-all text-sm md:text-base"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-dark text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.4em] text-[10px] md:text-xs hover:bg-neutral-800 transition-all hover:scale-[1.01] active:translate-y-1 shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="my-8 md:my-10 flex items-center gap-4">
                <div className="flex-1 h-px bg-neutral-100" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-300">Or</span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 md:gap-3 p-4 md:p-5 border border-neutral-100 rounded-2xl md:rounded-3xl hover:bg-neutral-50 transition-colors group"
                >
                  <Chrome size={18} className="text-neutral-400 group-hover:text-brand-dark" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand-dark/60 group-hover:text-brand-dark">Google</span>
                </button>
                <button 
                  disabled={loading}
                  className="flex items-center justify-center gap-2 md:gap-3 p-4 md:p-5 border border-neutral-100 rounded-2xl md:rounded-3xl hover:bg-neutral-50 transition-colors group opacity-50 cursor-not-allowed"
                >
                  <Github size={18} className="text-neutral-400" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Github</span>
                </button>
              </div>

              <p className="mt-8 md:mt-12 text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand-dark/30">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-brand-leaf hover:underline ml-1"
                >
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
