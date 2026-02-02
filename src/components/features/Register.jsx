import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, ArrowLeft, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '../../services/api';
import { supabase } from '../../config/supabase';

export default function Register({ onToggle, onBack }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Sign Up
      console.log("Signing up with:", { email: formData.email, username: formData.username, role: formData.role });

      const { data, error: authError } = await ApiService.signUp(formData.email, formData.password, {
        username: formData.username,
        role: formData.role
      });

      if (authError) throw authError;

      // Profile creation is handled by Database Triggers now.

      toast.success("Registration successful! Please check your email.");
      onToggle();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (e) => {
    e?.preventDefault();
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex bg-[#0B0C15] text-white overflow-hidden relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-50 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium backdrop-blur-md border border-white/5"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Left Panel - Abstract Art */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
      >
        <img
          src="/assets/auth-sidebar.png"
          alt="Abstract Art"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
        <div className="absolute bottom-12 left-12 right-12 text-white z-10">
          <h2 className="text-3xl font-bold mb-2">Designed for focus</h2>
          <p className="text-white/70">Experience the flow of a truly modern workspace.</p>
        </div>
      </motion.div>

      {/* Right Panel - Steps */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[400px]">

          {/* Progress Indicators */}
          <div className="flex gap-2 mb-8 justify-center">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-indigo-500' : 'bg-slate-800'}`} />
            ))}
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {step === 1 && "Create your account"}
              {step === 2 && "What's your role?"}
              {step === 3 && "Pick your username"}
            </h2>
            <p className="text-slate-400 mt-2">
              {step === 1 && "Start your journey with FirestoreX."}
              {step === 2 && "Help us personalize your experience."}
              {step === 3 && "Your unique identity on the platform."}
            </p>
          </div>

          <AnimatePresence mode='wait'>

            {/* STEP 1: CREDENTIALS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-3 shadow-none hover:shadow-lg active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0B0C15] px-2 text-slate-500">Or email</span></div>
                </div>

                <form onSubmit={nextStep}>
                  <div className="space-y-4">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#151621] border border-[#25263a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      placeholder="Email address"
                    />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      minLength={6}
                      className="w-full bg-[#151621] border border-[#25263a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      placeholder="Password (min 6 chars)"
                    />
                    <button type="submit" className="w-full py-3 bg-[#1F202E] text-white rounded-xl font-medium hover:bg-[#2A2B3D] flex justify-center items-center gap-2">
                      Continue <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: ROLE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {['Designer', 'Developer', 'Manager', 'Student'].map((role) => (
                    <button
                      key={role}
                      onClick={() => { setFormData({ ...formData, role }); nextStep(); }}
                      className={`p-4 rounded-xl border text-left transition-all ${formData.role === role ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-[#151621] border-[#25263a] text-slate-400 hover:border-slate-500'}`}
                    >
                      <Building2 size={24} className="mb-2" />
                      <span className="font-medium">{role}</span>
                    </button>
                  ))}
                </div>
                <button onClick={prevStep} className="w-full py-3 text-slate-500 hover:text-white flex justify-center items-center gap-2">
                  <ArrowLeft size={18} /> Back
                </button>
              </motion.div>
            )}

            {/* STEP 3: USERNAME */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full bg-[#151621] border border-[#25263a] rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    placeholder="username"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRegister}
                    disabled={loading || !formData.username}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                  </button>
                  <button onClick={prevStep} className="w-full py-3 text-slate-500 hover:text-white flex justify-center items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <button onClick={onToggle} className="text-white hover:underline font-medium">
              Sign in
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}