import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, User, Clock, Shield } from 'lucide-react';
import ApiService from '../../services/api';
import { supabase } from '../../config/supabase';

function parseActivityDetails(details) {
  if (!details) return null;
  if (typeof details === 'object') return details;

  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

export default function FileActivityModal({
  isOpen,
  onClose,
  file
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (!file?.id) return;
    if (showLoading) setLoading(true);

    try {
      const { data } = await ApiService.getFileLogs(file.id);
      setLogs(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [file?.id]);

  useEffect(() => {
    if (!isOpen || !file?.id) return undefined;

    fetchLogs();

    // Setup real-time subscription for this file's logs
    const channel = supabase
      .channel(`public:activity_logs:${file.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          const parsedDetails = parseActivityDetails(payload?.new?.details);
          if (parsedDetails && String(parsedDetails.fileId) === String(file.id)) {
            fetchLogs(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, file?.id, fetchLogs]);

  if (!isOpen || !file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0E0F19] rounded-2xl border border-[#25263a] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#25263a]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Activity Log</h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{file.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#151621] rounded-xl animate-pulse" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Shield size={48} className="mb-3 opacity-20" />
                <p>No activity recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1F202E]">
                {logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#1F202E] flex items-center justify-center shrink-0 border border-[#25263a]">
                      <User size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {log.profiles?.username || 'Anonymous User'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatAction(log.action)} <span className="text-slate-600">â€¢</span> {log.severity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatAction(action) {
  switch (action) {
    case 'FILE_ACCESS': return 'Accessed file';
    case 'FILE_UPLOADED': return 'Uploaded file';
    case 'SUSPICIOUS_UPLOAD_ATTEMPT': return 'Suspicious upload attempt';
    default: return action.replace(/_/g, ' ').toLowerCase();
  }
}

