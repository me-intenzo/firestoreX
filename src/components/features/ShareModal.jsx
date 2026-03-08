import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Lock, Users, Copy, Check, Search, Plus, Trash2, Clock, Download } from 'lucide-react';
import ApiService from '../../services/api';
import { toast } from 'sonner';

export default function ShareModal({
  isOpen,
  onClose,
  file
}) {
  const [accessLevel, setAccessLevel] = useState('private');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expirationHours, setExpirationHours] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [foundUser, setFoundUser] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    if (!file) return;

    setAccessLevel(file.access_level || 'private');
    setAllowedUsers(Array.isArray(file.allowed_users) ? file.allowed_users : []);
    setPassword('');
    setShareToken(file.share_token || null);
    setExpirationHours('');
    setMaxDownloads('');
  }, [file, isOpen]);

  if (!isOpen || !file) return null;
  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      textarea.remove();
    }

    return copied;
  };

  const handleCopyLink = async () => {
    if (!shareToken) {
      toast.error('Save sharing settings first to generate link');
      return;
    }

    const link = `${window.location.origin}/s/${shareToken}`;
    const copiedSuccessfully = await copyTextToClipboard(link);

    if (!copiedSuccessfully) {
      toast.error('Could not copy link automatically. Please copy it manually.');
      return;
    }

    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchUser = async () => {
    if (!searchQuery) return;

    setSearchingUser(true);
    try {
      const { data } = await ApiService.findUserByUsername(searchQuery);
      if (data) {
        setFoundUser(data);
      } else {
        setFoundUser(null);
        toast.error('User not found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error searching user');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddUser = () => {
    if (!foundUser) return;
    if (allowedUsers.some((u) => (typeof u === 'object' ? u.id : u) === foundUser.id)) {
      toast.warning('User already added');
      return;
    }

    setAllowedUsers([
      ...allowedUsers,
      { id: foundUser.id, username: foundUser.username, avatar_url: foundUser.avatar_url },
    ]);

    setFoundUser(null);
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setAllowedUsers(allowedUsers.filter((u) => (typeof u === 'object' ? u.id : u) !== userId));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const updates = {
        access_level: accessLevel,
        allowed_users: allowedUsers,
      };

      if (accessLevel !== 'private') {
        // Empty string means clear password gate
        updates.password = password;
      }

      if (expirationHours && parseInt(expirationHours, 10) > 0) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(expirationHours, 10));
        updates.share_expires_at = expiresAt.toISOString();
      }

      if (maxDownloads && parseInt(maxDownloads, 10) > 0) {
        updates.max_downloads = parseInt(maxDownloads, 10);
      }

      const { data, error } = await ApiService.updateFileSecurity(file.id, updates);
      if (error) throw error;

      const savedToken = Array.isArray(data) ? data[0]?.share_token : null;
      if (accessLevel !== 'private' && savedToken) {
        setShareToken(savedToken);
      }

      toast.success(`Security settings updated for ${file.name}`);
      onClose();
    } catch (error) {
      console.error('Failed to update security', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

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
          className="w-full max-w-md bg-[#0E0F19] rounded-2xl border border-[#25263a] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#25263a]">
            <h3 className="text-lg font-bold text-white">Share "{file.name}"</h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">File Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#151621] border border-[#25263a] rounded-lg px-3 py-2 text-sm text-slate-300 truncate font-mono">
                  {shareToken ? `${window.location.origin}/s/${shareToken.slice(0, 8)}...` : 'Save settings to generate secure link'}
                </div>
                <button onClick={handleCopyLink} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center min-w-[44px]">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Access Control</label>
              <div className="space-y-2">
                <AccessOption
                  active={accessLevel === 'public'}
                  onChange={() => setAccessLevel('public')}
                  icon={<Globe size={20} />}
                  title="Public Access"
                  description="Anyone with the link can view"
                />

                <AccessOption
                  active={accessLevel === 'password'}
                  onChange={() => setAccessLevel('password')}
                  icon={<Lock size={20} />}
                  title="Password Protection"
                  description="Require a password to access"
                />

                {(accessLevel === 'password' || accessLevel === 'restricted') && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pl-14 pr-2 overflow-hidden">
                    <input
                      type="password"
                      placeholder={accessLevel === 'restricted' ? 'Optional password gate' : 'Set access password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0B0C15] border border-[#25263a] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </motion.div>
                )}

                <AccessOption
                  active={accessLevel === 'restricted'}
                  onChange={() => setAccessLevel('restricted')}
                  icon={<Users size={20} />}
                  title="Restricted Access"
                  description="Only specific users can view"
                />

                {accessLevel === 'restricted' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pl-2 pr-2 pt-2">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Enter username"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-[#151621] border border-[#25263a] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                      />
                      <button
                        onClick={handleSearchUser}
                        disabled={searchingUser}
                        className="px-3 py-2 bg-[#25263a] hover:bg-[#2f304a] text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Search size={16} />
                      </button>
                    </div>

                    {foundUser && (
                      <div className="flex items-center justify-between p-2 bg-indigo-500/10 rounded-lg mb-3 border border-indigo-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {foundUser.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-white">{foundUser.username}</span>
                        </div>
                        <button onClick={handleAddUser} className="p-1 hover:bg-indigo-500/20 rounded text-indigo-400">
                          <Plus size={16} />
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {allowedUsers.map((userEntry) => {
                        const userId = typeof userEntry === 'object' ? userEntry.id : userEntry;
                        const username = typeof userEntry === 'object' ? userEntry.username : userEntry;

                        return (
                          <div key={userId} className="flex items-center justify-between p-2 bg-[#151621] rounded-lg border border-[#25263a]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                                {username ? String(username)[0].toUpperCase() : 'U'}
                              </div>
                              <span className="text-sm text-slate-300">{username}</span>
                            </div>
                            <button onClick={() => handleRemoveUser(userId)} className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                      {allowedUsers.length === 0 && <p className="text-xs text-slate-500 italic text-center py-2">No users added yet.</p>}
                    </div>
                  </motion.div>
                )}

                <AccessOption
                  active={accessLevel === 'private'}
                  onChange={() => setAccessLevel('private')}
                  icon={<Lock size={20} />}
                  title="Private"
                  description="Only you can view"
                />
              </div>
            </div>

            {accessLevel !== 'private' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Advanced Options</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <Clock size={14} />
                      Link Expiration (hours)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 24"
                      value={expirationHours}
                      onChange={(e) => setExpirationHours(e.target.value)}
                      min="1"
                      className="w-full bg-[#151621] border border-[#25263a] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for no expiration</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <Download size={14} />
                      Maximum Downloads
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 10"
                      value={maxDownloads}
                      onChange={(e) => setMaxDownloads(e.target.value)}
                      min="1"
                      className="w-full bg-[#151621] border border-[#25263a] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited downloads</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-5 border-t border-[#25263a] flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Settings
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AccessOption({ active, onChange, icon, title, description }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${active ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#151621] border-[#25263a] hover:border-slate-600'}`}>
      <input type="radio" name="access" checked={active} onChange={onChange} className="hidden" />
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-indigo-500 text-white' : 'bg-[#1F202E] text-slate-400'}`}>
        {icon}
      </div>
      <div>
        <div className={`font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{title}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
    </label>
  );
}


