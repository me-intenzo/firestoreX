import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Lock,
  KeyRound,
  Cloud,
  Database,
  Share2,
  Activity,
  Search,
  FolderTree,
  Clock,
  Download,
  Sparkles,
} from 'lucide-react';

const featureGroups = [
  {
    title: 'Security Core',
    description: 'Defense-in-depth controls built for academic secure-cloud workflows.',
    items: [
      { icon: <Shield size={18} />, title: 'Row-Level Security', text: 'Data isolation via PostgreSQL RLS policies for owner-scoped access.' },
      { icon: <Lock size={18} />, title: 'Client-Side Encryption', text: 'AES-256-GCM encryption support before upload for zero-knowledge patterns.' },
      { icon: <KeyRound size={18} />, title: 'Password Protected Shares', text: 'Optional bcrypt-protected share links with expiry and download limits.' },
      { icon: <Activity size={18} />, title: 'Audit Logging', text: 'Security and file operations are captured in activity logs for traceability.' },
    ],
  },
  {
    title: 'Cloud & Storage',
    description: 'Built on Supabase cloud services with storage + relational metadata.',
    items: [
      { icon: <Cloud size={18} />, title: 'Supabase Auth', text: 'Secure email/password and OAuth-ready authentication flow.' },
      { icon: <Database size={18} />, title: 'PostgreSQL Metadata', text: 'File metadata, sharing policy, and logs stored in relational schema.' },
      { icon: <FolderTree size={18} />, title: 'Virtual Folder Layout', text: 'Path-based organization, folder creation, and hierarchy-aware browsing.' },
      { icon: <Download size={18} />, title: 'Controlled Downloads', text: 'Download operations are tracked and can be policy-limited.' },
    ],
  },
  {
    title: 'Productivity & UX',
    description: 'Fast interaction loops for day-to-day file operations.',
    items: [
      { icon: <Search size={18} />, title: 'Search + Filter', text: 'Instant in-dashboard name filtering across recent/starred/current views.' },
      { icon: <Share2 size={18} />, title: 'Secure Share Flows', text: 'Context-driven share modal to configure access level and limits.' },
      { icon: <Clock size={18} />, title: 'Recent + Activity Views', text: 'Dedicated views for latest files and timeline-style activity inspection.' },
      { icon: <Sparkles size={18} />, title: 'Modern Motion UI', text: 'Framer Motion transitions, spotlight interactions, and visual hierarchy.' },
    ],
  },
];

export default function FeaturesPage({ onBack, onGetStarted, onLogin }) {
  return (
    <div className="min-h-screen bg-[#05050A] text-slate-200 px-6 py-10 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(99,102,241,0.15),transparent_30%)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-10 gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-4 py-2 rounded-xl text-sm bg-white/5 hover:bg-white/10 transition-colors">Log In</button>
            <button onClick={onGetStarted} className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 transition-colors">Get Started</button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300 mb-3">Complete Capability Map</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything FirestoreX Can Do</h1>
          <p className="text-slate-300 max-w-3xl">
            This page summarizes the full feature surface of the app: secure authentication,
            cloud-native storage, controlled file sharing, and activity-driven observability.
          </p>
        </motion.div>

        <div className="space-y-8">
          {featureGroups.map((group, groupIndex) => (
            <motion.section
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.08 }}
              className="rounded-3xl border border-white/10 bg-[#0B0F1B]/80 backdrop-blur-md p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">{group.title}</h2>
              <p className="text-slate-400 mb-6">{group.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/15 text-sky-300 mb-3">
                      {item.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
