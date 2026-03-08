import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Lock,
  Shield,
  AlertTriangle,
  UserCheck,
  Clock,
  LogIn,
  Home,
  Eye,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '../../services/api';

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function canUserAccessRestricted(file, user) {
  if (!file || file.access_level !== 'restricted') return true;
  if (!user) return false;
  if (file.owner_id && user.id === file.owner_id) return true;

  const allowed = Array.isArray(file.allowed_users) ? file.allowed_users : [];

  return allowed.some((entry) => {
    if (typeof entry === 'string') return entry === user.id;
    if (entry && typeof entry === 'object') {
      return entry.id === user.id || entry.user_id === user.id || entry.uid === user.id;
    }
    return false;
  });
}

export default function SharedFilePage({ token, user, authLoading, onBackHome, onLogin, onOpenApp }) {
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSharedFile = async () => {
      setLoading(true);
      setErrorMessage('');
      setFile(null);
      setPassword('');
      setPasswordVerified(false);

      if (!token) {
        setErrorMessage('Invalid share link.');
        setLoading(false);
        return;
      }

      const { data, error } = await ApiService.getSharedFileByToken(token);
      if (!mounted) return;

      if (error || !data) {
        setErrorMessage('This share link is invalid, expired, or no longer available.');
        setLoading(false);
        return;
      }

      if (data.access_level === 'private') {
        setErrorMessage('This file is private and cannot be accessed through share link.');
        setLoading(false);
        return;
      }

      if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
        setErrorMessage('This share link has expired.');
        setLoading(false);
        return;
      }

      if (data.max_downloads && data.downloads >= data.max_downloads) {
        setErrorMessage('This share link reached its download limit.');
        setLoading(false);
        return;
      }

      setFile(data);
      if (!data.password_hash) setPasswordVerified(true);
      setLoading(false);
    };

    fetchSharedFile();

    return () => {
      mounted = false;
    };
  }, [token]);

  const restrictedAllowed = useMemo(() => canUserAccessRestricted(file, user), [file, user]);
  const requiresPassword = !!file?.password_hash;
  const passwordGatePassed = !requiresPassword || passwordVerified;

  const remainingDownloads = useMemo(() => {
    if (!file?.max_downloads) return null;
    return Math.max(file.max_downloads - (file.downloads || 0), 0);
  }, [file]);

  const verifyPassword = async () => {
    if (!file?.id || !password.trim()) return;

    setVerifyingPassword(true);
    try {
      const { valid } = await ApiService.verifyFilePassword(file.id, password.trim());
      if (!valid) {
        toast.error('Incorrect password');
      } else {
        setPasswordVerified(true);
        toast.success('Password verified');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to verify password');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    if (!restrictedAllowed || !passwordGatePassed) return;
    if (remainingDownloads !== null && remainingDownloads <= 0) {
      toast.error('Download limit reached for this file');
      return;
    }

    setDownloading(true);

    try {
      const { blob, url, error } = await ApiService.getSharedDownload(file.storage_path);
      if (error) throw error;

      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);

      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else if (url) {
        link.href = url;
        link.download = file.name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      } else {
        throw new Error('Could not create download link');
      }

      link.remove();

      await ApiService.logFileAccess(file.id, 'download');
      setFile((prev) => (prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev));
      toast.success('Download started');
    } catch (error) {
      toast.error(error?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || (file?.access_level === 'restricted' && !user && authLoading)) {
    return (
      <div className="min-h-screen bg-[#05050A] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-200 px-6 py-12">
        <div className="max-w-xl mx-auto rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-300" size={40} />
          <h1 className="text-2xl font-bold text-white mb-3">Share Link Unavailable</h1>
          <p className="text-slate-300 mb-6">{errorMessage}</p>
          <button onClick={onBackHome} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors inline-flex items-center gap-2">
            <Home size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!file) return null;

  if (file.access_level === 'restricted' && !user) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-200 px-6 py-12">
        <div className="max-w-xl mx-auto rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-8 text-center">
          <UserCheck className="mx-auto mb-4 text-indigo-300" size={40} />
          <h1 className="text-2xl font-bold text-white mb-3">Login Required</h1>
          <p className="text-slate-300 mb-6">This is a restricted shared file. Sign in with an allowed account to continue.</p>
          <button onClick={() => onLogin?.(token)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
            <LogIn size={16} />
            Log In and Continue
          </button>
        </div>
      </div>
    );
  }

  if (!restrictedAllowed) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-200 px-6 py-12">
        <div className="max-w-xl mx-auto rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <Shield className="mx-auto mb-4 text-amber-300" size={40} />
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-slate-300 mb-6">Your account is not in the allowed users list for this file.</p>
          <button onClick={onOpenApp} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-200 px-6 py-8 md:py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_84%_84%,rgba(99,102,241,0.14),transparent_30%)]" />

      <div className="max-w-2xl mx-auto relative z-10">
        <button onClick={onBackHome} className="mb-6 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} />
          Home
        </button>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-[#0B1020]/90 backdrop-blur-md p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300 mb-2">Shared File</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-5 break-words">{file.name}</h1>

          <div className="grid sm:grid-cols-3 gap-3 mb-6 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400 mb-1">Size</p>
              <p className="text-white font-medium">{formatBytes(file.size)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400 mb-1">Type</p>
              <p className="text-white font-medium truncate">{file.type || 'Unknown'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400 mb-1">Access</p>
              <p className="text-white font-medium capitalize">{file.access_level}</p>
            </div>
          </div>

          {file.share_expires_at && (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 flex items-center gap-2">
              <Clock size={14} className="text-sky-300" />
              Expires at {new Date(file.share_expires_at).toLocaleString()}
            </div>
          )}

          {remainingDownloads !== null && (
            <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 flex items-center gap-2">
              <Eye size={14} className="text-sky-300" />
              Remaining downloads: {remainingDownloads}
            </div>
          )}

          {requiresPassword && !passwordVerified && (
            <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <p className="text-sm text-indigo-200 mb-3 flex items-center gap-2">
                <KeyRound size={14} />
                This file is password protected.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-1 bg-[#0F1528] border border-[#2A3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
                <button
                  onClick={verifyPassword}
                  disabled={verifyingPassword || !password}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors text-white text-sm font-semibold"
                >
                  {verifyingPassword ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading || !passwordGatePassed || (remainingDownloads !== null && remainingDownloads <= 0)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 font-semibold"
          >
            {downloading ? <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
            {downloading ? 'Preparing download...' : 'Download File'}
          </button>

          {file.access_level === 'restricted' && (
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-2">
              <Lock size={12} />
              Restricted file: only whitelisted users can access this shared resource.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

