import { motion, useScroll, useTransform, useSpring, useMotionTemplate, useMotionValue } from 'framer-motion';
import { ArrowRight, Shield, Lock, Search, Cloud, Database, Activity, Share2, Download, FolderTree } from 'lucide-react';
import { useRef, useState } from 'react';
import LegalModal from '../ui/LegalModal';

function Spotlight({ children, className = '' }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`relative border border-white/10 bg-[#151621] overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

export default function LandingPage({ onGetStarted, onLogin, onFeatures }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const yHero = useTransform(springScroll, [0, 0.5], [0, 200]);
  const opacityHero = useTransform(springScroll, [0, 0.3], [1, 0]);
  const bgY = useTransform(springScroll, [0, 1], ['0%', '50%']);

  const [legalOpen, setLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState('privacy');

  const openLegal = (type) => {
    setLegalType(type);
    setLegalOpen(true);
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={containerRef} className="min-h-[200vh] bg-[#05050A] overflow-x-hidden text-slate-300 selection:bg-indigo-500/30 font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[50%] bg-blue-600/5 rounded-full blur-[150px] mix-blend-screen" />
        <motion.div style={{ y: bgY }} className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <nav className="fixed top-0 w-full z-50 bg-[#05050A]/70 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-xl text-white tracking-tight cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/assets/firestorex-logo.svg" alt="FirestoreX logo" className="h-9 w-9 rounded-xl" />
            FirestoreX
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400 items-center">
            <button onClick={onFeatures} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('security-cloud')} className="hover:text-white transition-colors">Security</button>
            <button onClick={() => scrollToSection('cloud-integration')} className="hover:text-white transition-colors">Cloud</button>
            <button onClick={() => scrollToSection('audit-layer')} className="hover:text-white transition-colors">Auditing</button>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={onLogin} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log In</button>
            <button
              onClick={onGetStarted}
              className="group relative px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Get Started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-48 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ y: yHero, opacity: opacityHero }}
            className="space-y-8 relative z-20 flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium backdrop-blur-md shadow-lg shadow-indigo-500/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              </span>
              Introducing v2.0 <span className="text-slate-500 mx-1">|</span> <span className="text-slate-300 group-hover:text-white transition-colors">Read the changelog</span>
            </div>

            <h1 className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-[1.1] drop-shadow-2xl">
              Cloud storage for <br />
              <span className="inline-block relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">builders.</span>
                <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 blur-2xl opacity-20 pointer-events-none" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              Experience the new standard for modern teams.
              <span className="text-slate-300 font-medium"> Secure by default</span>,
              <span className="text-slate-300 font-medium"> scalable by design</span>, and
              <span className="text-slate-300 font-medium"> controlled for compliance</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5"
              >
                Start Building Free
              </button>
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-[#1F202E]/80 backdrop-blur-md text-white rounded-2xl font-bold transition-all border border-white/10 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
              >
                Live Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need.<br /><span className="text-slate-500">Only real capabilities.</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 grid-flow-dense">
          <Spotlight className="md:col-span-2 lg:col-span-2 row-span-2 rounded-3xl p-8 group">
            <div className="h-full flex flex-col">
              <div className="mb-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Zero-Knowledge Security</h3>
                <p className="text-slate-400">Client-side encryption support plus database-level isolation with RLS.</p>
              </div>
              <div className="mt-8 relative h-40 overflow-hidden rounded-xl border border-white/5 bg-black/50">
                <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-mono text-xs opacity-50">
                  AES-256-GCM / bcrypt / RLS
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500 rounded-full blur-[50px] opacity-20 animate-pulse" />
              </div>
            </div>
          </Spotlight>

          <Spotlight className="md:col-span-1 lg:col-span-1 row-span-2 rounded-3xl p-8 group">
            <div className="h-full flex flex-col">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mb-4">
                <Share2 size={20} className="text-sky-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Controlled Sharing</h3>
              <p className="text-slate-400 text-sm mb-8">Token URL, password gate, restricted-user checks, expiry, and download caps.</p>
              <div className="mt-auto relative h-64 border-l border-white/10 ml-2">
                <div className="absolute top-[8%] left-[-1px] w-[2px] h-1/4 bg-gradient-to-b from-transparent via-sky-400 to-transparent" />
                <div className="absolute top-[44%] left-[-1px] w-[2px] h-1/4 bg-gradient-to-b from-transparent via-sky-400 to-transparent" />
                <div className="absolute bottom-[8%] left-[-1px] w-[2px] h-1/4 bg-gradient-to-b from-transparent via-sky-400 to-transparent" />
              </div>
            </div>
          </Spotlight>

          <Spotlight className="rounded-3xl p-6 group">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <Search size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Fast File Search</h3>
            <p className="text-slate-400 text-sm">Instant name filtering across My Files, Recent, and Starred views.</p>
          </Spotlight>

          <Spotlight className="rounded-3xl p-6 group">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Download size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Upload Guardrails</h3>
            <p className="text-slate-400 text-sm">Security validation and strict size limits before storage operations.</p>
          </Spotlight>

          <Spotlight className="md:col-span-3 lg:col-span-2 rounded-3xl p-8 group flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                <FolderTree size={20} className="text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cloud File Workspace</h3>
              <p className="text-slate-400">Folder-path organization, starred workflows, and activity visibility in a single dashboard.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              {['My Files', 'Recent', 'Starred', 'Activity'].map((item) => (
                <div key={item} className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-slate-300 text-center">
                  {item}
                </div>
              ))}
              <div className="col-span-2 px-3 py-2 rounded-lg border border-violet-400/30 bg-violet-500/10 text-xs text-violet-200 text-center">
                Share + Access Control
              </div>
            </div>
          </Spotlight>
        </div>
      </section>

      <section id="security-cloud" className="py-20 border-t border-white/5 bg-[#05050A] relative z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020205] pointer-events-none" />
        <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-12 relative z-10">Security architecture and cloud integration</p>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div id="audit-layer" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center mb-4">
              <Shield size={18} />
            </div>
            <h3 className="text-white font-semibold mb-2">Security First</h3>
            <p className="text-sm text-slate-400">RLS policies, protected metadata, and audited operations by design.</p>
          </div>
          <div id="cloud-integration" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center mb-4">
              <Cloud size={18} />
            </div>
            <h3 className="text-white font-semibold mb-2">Cloud-Native Stack</h3>
            <p className="text-sm text-slate-400">Supabase Auth + Storage + PostgreSQL running as one integrated backend.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-4">
              <Database size={18} />
            </div>
            <h3 className="text-white font-semibold mb-2">Data Governance</h3>
            <p className="text-sm text-slate-400">Structured file metadata, access levels, and share lifecycle controls.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center mb-4">
              <Activity size={18} />
            </div>
            <h3 className="text-white font-semibold mb-2">Operational Visibility</h3>
            <p className="text-sm text-slate-400">Activity logs and secure sharing metrics keep sensitive flows observable.</p>
          </div>
        </div>
      </section>

      <footer className="py-24 border-t border-white/5 bg-[#020205] text-slate-500 text-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-12 gap-12">
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight mb-6">
              <img src="/assets/firestorex-logo.svg" alt="FirestoreX logo" className="w-7 h-7 rounded-md" />
              FirestoreX
            </div>
            <p className="mb-6">Secure cloud storage with encryption, controlled sharing, and audit visibility.</p>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4">
              <li><button onClick={onFeatures} className="hover:text-indigo-400 transition-colors text-left">All Features</button></li>
              <li><button onClick={() => scrollToSection('security-cloud')} className="hover:text-indigo-400 transition-colors text-left">Security Layer</button></li>
              <li><button onClick={() => scrollToSection('cloud-integration')} className="hover:text-indigo-400 transition-colors text-left">Cloud Integration</button></li>
              <li><button onClick={() => scrollToSection('audit-layer')} className="hover:text-indigo-400 transition-colors text-left">Audit Trail</button></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><button onClick={() => openLegal('privacy')} className="hover:text-indigo-400 transition-colors text-left">Privacy</button></li>
              <li><button onClick={() => openLegal('terms')} className="hover:text-indigo-400 transition-colors text-left">Terms</button></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-white mb-6">Status</h4>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Normal
            </div>
          </div>
        </div>
      </footer>

      <LegalModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} type={legalType} />
    </div>
  );
}
