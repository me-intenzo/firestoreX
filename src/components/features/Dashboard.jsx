import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, File, Image, Music, Video, Search, Bell, Upload, X, Settings, Shield,
  ChevronsRight, Folder, LogOut, ChevronRight, MoreVertical, Share2, Trash2, Download,
  FileText, FolderPlus, Activity, Clock, Database, Star, Menu, HardDrive, TrendingUp, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { ContextMenu } from '../ui';
import ShareModal from './ShareModal';
import FileActivityModal from './FileActivityModal';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);
  const [activityModalData, setActivityModalData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('files');

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

  const { currentFolderFiles, folders, totalSize, storageStats } = useMemo(() => {
    const normalizedPath = currentPath ? (currentPath.endsWith('/') ? currentPath : `${currentPath}/`) : '';
    let size = 0;
    const typeStats = { images: 0, videos: 0, documents: 0, others: 0 };

    const currentFiles = files.filter(f => {
      size += (f.size || 0);
      if (f.type?.includes('image')) typeStats.images += f.size || 0;
      else if (f.type?.includes('video')) typeStats.videos += f.size || 0;
      else if (f.type?.includes('pdf') || f.type?.includes('document')) typeStats.documents += f.size || 0;
      else typeStats.others += f.size || 0;

      const path = f.storage_path || '';
      const lastSlashIndex = path.lastIndexOf('/');
      const fileFolder = lastSlashIndex === -1 ? '' : path.substring(0, lastSlashIndex + 1);
      return fileFolder === normalizedPath;
    });

    const subFolders = new Set();
    files.forEach(f => {
      const path = f.storage_path || '';
      if (path.startsWith(normalizedPath)) {
        const relativePath = path.substring(normalizedPath.length);
        const slashIndex = relativePath.indexOf('/');
        if (slashIndex !== -1) {
          subFolders.add(relativePath.substring(0, slashIndex));
        }
      }
    });

    return {
      currentFolderFiles: currentFiles,
      folders: Array.from(subFolders).map(name => ({ name, type: 'folder' })),
      totalSize: size,
      storageStats: typeStats
    };
  }, [files, currentPath]);

  const recentFiles = useMemo(() => {
    return [...files].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  }, [files]);

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    processFiles(fileList);
  };

  const processFiles = async (fileList) => {
    const uploadPromises = Array.from(fileList).map(async (file) => {
      try {
        const folderPrefix = currentPath ? (currentPath.endsWith('/') ? currentPath : `${currentPath}/`) : '';
        const path = `${folderPrefix}${Date.now()}_${file.name}`;
        const { error } = await ApiService.uploadFile('uploads', path, file);
        if (error) throw error;
        return true;
      } catch (error) {
        toast.error(`Error uploading ${file.name}: ${error.message}`);
        return false;
      }
    });
    await Promise.all(uploadPromises);
    toast.success('Upload complete');
    fetchFiles();
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    const folderPath = currentPath ? `${currentPath}/${name}/.keep` : `${name}/.keep`;
    const dummyFile = new File([""], ".keep", { type: "application/x-directory" });
    ApiService.uploadFile('uploads', folderPath, dummyFile).then(() => {
      toast.success(`Folder "${name}" created`);
      fetchFiles();
    });
  };

  const handleDownload = async (file) => {
    try {
      const { data } = await ApiService.supabase.storage.from('uploads').download(file.storage_path);
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        await ApiService.logFileAccess(file.id, 'download');
        toast.success('Download started');
      }
    } catch (e) {
      console.error(e);
      toast.error('Download failed');
    }
  };

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/')
    }));
  }, [currentPath]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(false); };
  const handleDrop = async (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) await processFiles(e.dataTransfer.files); };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const contextMenuActions = [
    {
      label: 'Open', icon: <FileText size={16} />, onClick: () => {
        if (contextMenu?.item?.type === 'folder') setCurrentPath(currentPath ? `${currentPath}/${contextMenu.item.name}` : contextMenu.item.name);
        else setSelectedFile(contextMenu?.item);
      }
    },
    { label: 'Download', icon: <Download size={16} />, onClick: () => handleDownload(contextMenu?.item) },
    { label: 'Share', icon: <Share2 size={16} />, onClick: () => setShareModalData(contextMenu?.item) },
    { label: 'Activity', icon: <Activity size={16} />, onClick: () => setActivityModalData(contextMenu?.item) },
    {
      label: 'Delete', variant: 'danger', icon: <Trash2 size={16} />, onClick: () => {
        if (confirm(`Delete ${contextMenu?.item?.name}?`)) toast.success('Deleted (Mock)');
      }
    },
  ];

  const globalContextMenuActions = [
    { label: 'New Folder', icon: <FolderPlus size={16} />, onClick: handleCreateFolder },
    { label: 'Upload File', icon: <Upload size={16} />, onClick: () => document.querySelector('input[type="file"]')?.click() },
    { label: 'Refresh', icon: <Activity size={16} />, onClick: () => { setLoading(true); fetchFiles(); } },
  ];

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storageLimit = 5 * 1024 * 1024 * 1024;
  const storagePercent = (totalSize / storageLimit) * 100;

  return (
    <div
      className="flex h-screen bg-[#05050A] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30"
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-indigo-500"
          >
            <div className="text-center">
              <Upload size={64} className="mx-auto mb-4 text-indigo-400" />
              <p className="text-2xl font-bold text-white">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.aside animate={{ width: navCollapsed ? 80 : 260 }} className="h-full bg-[#0B0C15]/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 relative">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield size={20} className="text-white" />
          </div>
          {!navCollapsed && <span className="ml-4 font-bold text-xl text-white tracking-tight">FirestoreX</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className={`px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4 ${navCollapsed ? 'hidden' : 'block'}`}>Menu</p>
          <NavItem icon={<LayoutGrid size={20} />} label="Overview" active={activeView === 'files'} onClick={() => { setActiveView('files'); setCurrentPath(''); }} collapsed={navCollapsed} />
          <NavItem icon={<Folder size={20} />} label="My Files" collapsed={navCollapsed} onClick={() => { setActiveView('files'); setCurrentPath(''); }} />
          <NavItem icon={<Clock size={20} />} label="Recent" collapsed={navCollapsed} onClick={() => toast.info('Recent Files - Coming Soon')} />
          <NavItem icon={<Star size={20} />} label="Starred" collapsed={navCollapsed} onClick={() => toast.info('Starred Files - Coming Soon')} />

          <div className="h-px bg-white/5 my-4 mx-2" />

          <p className={`px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ${navCollapsed ? 'hidden' : 'block'}`}>System</p>
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeView === 'settings'} collapsed={navCollapsed} onClick={() => setActiveView('settings')} />
          <NavItem icon={<Shield size={20} />} label="Trust Center" active={activeView === 'trust'} collapsed={navCollapsed} onClick={() => setActiveView('trust')} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => setNavCollapsed(!navCollapsed)} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors">
            <ChevronsRight size={20} className={`transition-transform ${navCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            {!navCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
            {!navCollapsed && (
              <button onClick={signOut} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <LogOut size={16} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        <header className="h-20 border-b border-white/5 bg-[#0B0C15]/30 backdrop-blur-xl flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => setCurrentPath('')} className="hover:text-white transition-colors">Home</button>
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ChevronRight size={16} className="text-slate-600" />
                  <button onClick={() => setCurrentPath(crumb.path)} className="hover:text-white transition-colors">{crumb.name}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2">
              <Upload size={18} />
              Upload
              <input type="file" multiple onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto p-8"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'global' }); }}
        >
          {activeView === 'settings' ? (
            <SettingsView user={user} />
          ) : activeView === 'trust' ? (
            <TrustCenterView />
          ) : (
            <>
          {!currentPath && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 flex items-center justify-center">
                    <HardDrive size={24} className="text-indigo-400" />
                  </div>
                  <span className="text-xs text-slate-400">Storage</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{formatBytes(totalSize)}</h3>
                <p className="text-sm text-slate-400 mb-3">of 5 GB used</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${storagePercent}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center">
                    <FileText size={24} className="text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400">Total Files</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{files.length}</h3>
                <p className="text-sm text-slate-400">Files stored</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/30 flex items-center justify-center">
                    <TrendingUp size={24} className="text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400">Activity</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{recentFiles.length}</h3>
                <p className="text-sm text-slate-400">Recent uploads</p>
              </motion.div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{currentPath || 'All Files'}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}>
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}>
                <List size={18} />
              </button>
              <button onClick={handleCreateFolder} className="ml-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                <FolderPlus size={18} />
                New Folder
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'}>
              {folders.map((folder, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onContextMenu={(e) => handleContextMenu(e, folder)}
                  onClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder.name}` : folder.name)}
                  className={viewMode === 'grid' 
                    ? 'bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all group'
                    : 'bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all flex items-center gap-4'
                  }
                >
                  <div className={viewMode === 'grid' ? 'w-full aspect-square bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-3' : 'w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg flex items-center justify-center shrink-0'}>
                    <Folder size={viewMode === 'grid' ? 32 : 24} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{folder.name}</p>
                    {viewMode === 'list' && <p className="text-xs text-slate-500">Folder</p>}
                  </div>
                </motion.div>
              ))}

              {currentFolderFiles.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (folders.length + i) * 0.05 }}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className={viewMode === 'grid'
                    ? 'bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all group'
                    : 'bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all flex items-center gap-4'
                  }
                >
                  <div className={viewMode === 'grid' ? 'w-full aspect-square bg-white/5 rounded-lg flex items-center justify-center mb-3' : 'w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0'}>
                    {getFileIcon(file.type, viewMode === 'grid' ? 32 : 24)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                  {viewMode === 'list' && (
                    <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file); }} className="p-2 hover:bg-white/10 rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!loading && folders.length === 0 && currentFolderFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Database size={64} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No files yet</h3>
              <p className="text-slate-400 mb-6">Upload your first file to get started</p>
              <label className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2">
                <Upload size={20} />
                Upload Files
                <input type="file" multiple onChange={handleUpload} className="hidden" />
              </label>
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          actions={contextMenu.type === 'global' ? globalContextMenuActions : contextMenuActions}
        />
      )}

      {shareModalData && <ShareModal isOpen={!!shareModalData} file={shareModalData} onClose={() => { setShareModalData(null); fetchFiles(); }} />}
      {activityModalData && <FileActivityModal isOpen={!!activityModalData} file={activityModalData} onClose={() => setActivityModalData(null)} />}
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'hover:bg-white/5'}`}>
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>{icon}</div>
      {!collapsed && <span className={`font-semibold text-sm ${active ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>{label}</span>}
    </button>
  );
}

function getFileIcon(type, size = 24) {
  if (!type) return <File size={size} className="text-slate-400" />;
  if (type.includes('image')) return <Image size={size} className="text-blue-400" />;
  if (type.includes('video')) return <Video size={size} className="text-purple-400" />;
  if (type.includes('audio')) return <Music size={size} className="text-pink-400" />;
  if (type.includes('pdf') || type.includes('document')) return <FileText size={size} className="text-orange-400" />;
  return <File size={size} className="text-slate-400" />;
}

function SettingsView({ user }) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Email</label>
              <input type="email" value={user?.email || ''} disabled className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Username</label>
              <input type="text" value={user?.email?.split('@')[0] || ''} disabled className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Storage</h2>
          <p className="text-slate-400 mb-4">Manage your storage and file retention policies</p>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold transition-colors">Upgrade Storage</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Security</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Add an extra layer of security</p>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">Enable</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">Change</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TrustCenterView() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">Trust Center</h1>
      
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-600/30 flex items-center justify-center">
              <Shield size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Academic Project Disclaimer</h2>
              <p className="text-sm text-yellow-400">For educational purposes only</p>
            </div>
          </div>
          <p className="text-slate-300 mb-3">This is an academic capstone project demonstrating security concepts and best practices. It is NOT production-ready and should NOT be used for storing sensitive or confidential information.</p>
          <p className="text-sm text-slate-400">For production use, professional security audit, penetration testing, and compliance certifications are required.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Implemented Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Client-Side Encryption</h3>
              <p className="text-sm text-slate-400">Optional AES-256-GCM encryption with PBKDF2 key derivation</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Password Hashing</h3>
              <p className="text-sm text-slate-400">bcrypt with 12 salt rounds for share link passwords</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Secure File Sharing</h3>
              <p className="text-sm text-slate-400">Time-limited links with download limits and password protection</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Activity Logging</h3>
              <p className="text-sm text-slate-400">Comprehensive audit trail for security events</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Row-Level Security</h3>
              <p className="text-sm text-slate-400">PostgreSQL RLS policies for data isolation</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">File Validation</h3>
              <p className="text-sm text-slate-400">Type checking and 15MB size limit enforcement</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Authentication & Authorization</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
              <div>
                <p className="text-white font-medium">Supabase Authentication</p>
                <p className="text-sm text-slate-400">Email/password authentication with session management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
              <div>
                <p className="text-white font-medium">Access Control</p>
                <p className="text-sm text-slate-400">Owner-based permissions with public/private/restricted/password levels</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
              <div>
                <p className="text-white font-medium">Database Security</p>
                <p className="text-sm text-slate-400">PostgreSQL with Row-Level Security (RLS) enabled</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Known Limitations</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2"></div>
              <p className="text-sm text-slate-400">Encryption keys stored in browser memory (session-based)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2"></div>
              <p className="text-sm text-slate-400">No key recovery mechanism for encrypted files (by design)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2"></div>
              <p className="text-sm text-slate-400">15MB file size limit</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2"></div>
              <p className="text-sm text-slate-400">Browser-dependent performance for encryption operations</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">React.js</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">Supabase</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">PostgreSQL</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">Web Crypto API</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">bcrypt.js</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-slate-300">Tailwind CSS</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
