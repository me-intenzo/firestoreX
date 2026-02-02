import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, File, Image, Music, Video,
  Search, Bell, Upload, X, Command, Settings, Shield,
  ChevronsRight, Folder, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedFile, setSelectedFile] = useState(null); // For Quick View
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await ApiService.getData('files', { owner_id: user.id });
      setFiles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      await ApiService.uploadFile('uploads', path, file);
      fetchFiles();
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0C15] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Sidebar Navigation */}
      <motion.aside
        animate={{ width: navCollapsed ? 72 : 240 }}
        className="h-full border-r border-[#1F202E] bg-[#0E0F19] flex flex-col transition-all duration-300 ease-spring"
      >
        <div className="h-16 flex items-center px-4 border-b border-[#1F202E]/50">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {!navCollapsed && (
            <span className="ml-3 font-semibold text-white tracking-tight">FirestoreX</span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={<LayoutGrid size={20} />} label="Overview" active collapsed={navCollapsed} />
          <NavItem icon={<Folder size={20} />} label="My Files" collapsed={navCollapsed} />
          <NavItem icon={<Shield size={20} />} label="Security" collapsed={navCollapsed} />
          <NavItem icon={<Settings size={20} />} label="Settings" collapsed={navCollapsed} />
        </nav>

        <div className="p-3 border-t border-[#1F202E]">
          <button
            onClick={() => setNavCollapsed(!navCollapsed)}
            className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-white transition-colors"
          >
            {navCollapsed ? <ChevronsRight size={20} /> : <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">Collapse</div>}
          </button>

          <div className="mt-2 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            {!navCollapsed && (
              <div className="overflow-hidden flex-1">
                <div className="text-sm text-white truncate font-medium">{user.email?.split('@')[0]}</div>
                <div className="text-xs text-slate-500">Free Plan</div>
              </div>
            )}

            {/* Log Out Button */}
            <button
              onClick={() => ApiService.signOut()}
              className={`absolute right-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors ${navCollapsed ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B0C15]">

        {/* Topbar */}
        <header className="h-16 border-b border-[#1F202E] flex items-center justify-between px-6 bg-[#0B0C15]/80 backdrop-blur-xl z-10 sticky top-0">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search or type command..."
                className="w-full bg-[#151621] border border-[#25263a] rounded-lg pl-10 pr-12 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Command size={12} className="text-slate-600" />
                <span className="text-xs text-slate-600 font-mono">K</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95">
              <Upload size={16} />
              <span>Upload</span>
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
            <div className="h-6 w-px bg-[#25263a]" />
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-7xl mx-auto">

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
                <p className="text-slate-500 text-sm">Welcome back to your workspace</p>
              </div>
              <div className="flex bg-[#151621] p-1 rounded-lg border border-[#25263a]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#25263a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#25263a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-[#151621] rounded-2xl animate-pulse" />)}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[#1F202E] rounded-3xl">
                <div className="w-16 h-16 bg-[#151621] rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No files yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-6">Upload your first file to get started with secure cloud storage.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6" : "space-y-2"}>
                  {files.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      onClick={() => setSelectedFile(file)}
                      className={`group relative cursor-pointer ${viewMode === 'grid'
                          ? "aspect-[4/5] bg-[#151621] border border-[#25263a] rounded-2xl p-4 flex flex-col hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all"
                          : "flex items-center gap-4 bg-[#151621] border border-[#1F202E] p-3 rounded-xl hover:bg-[#1F202E] transition-colors"
                        }`}
                    >
                      {/* File Icon/Preview */}
                      <div className={`${viewMode === 'grid' ? "flex-1 mb-4 bg-[#0B0C15] rounded-xl flex items-center justify-center overflow-hidden relative" : "w-10 h-10 bg-[#0B0C15] rounded-lg flex items-center justify-center shrink-0"}`}>
                        {/* Mock Preview or Icon */}
                        <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                          {getFileIcon(file.type)}
                        </div>
                        {viewMode === 'grid' && (
                          <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-200 truncate text-sm">{file.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          {(file.size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {viewMode === 'list' && <div className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Encrypted</div>}
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

          </div>
        </div>
      </main>

      {/* Quick View Modal (Overlay) */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0E0F19] rounded-3xl border border-[#25263a] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-[#25263a]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg truncate max-w-xs">{selectedFile.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 bg-[#0B0C15] flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-[#1F202E] rounded-2xl flex items-center justify-center text-slate-500">
                    {getFileIcon(selectedFile.type, 48)}
                  </div>
                  <p className="text-slate-400">Preview not available for encrypted files.</p>
                  <button className="mt-6 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                    Download & Decrypt
                  </button>
                </div>
              </div>

              {/* Footer metadata */}
              <div className="p-6 bg-[#0E0F19] border-t border-[#25263a] grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs uppercase mb-1">Type</span>
                  <span className="text-slate-300 font-mono">{selectedFile.type || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase mb-1">Size</span>
                  <span className="text-slate-300 font-mono">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function NavItem({ icon, label, active, collapsed }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium text-sm">{label}</span>
      )}
    </button>
  );
}

function getFileIcon(type, size = 24) {
  if (!type) return <File size={size} />;
  if (type.includes('image')) return <Image size={size} />;
  if (type.includes('video')) return <Video size={size} />;
  if (type.includes('audio')) return <Music size={size} />;
  return <File size={size} />;
}