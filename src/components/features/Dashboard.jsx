import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, Upload, Activity, User, Shield, Database, 
  TrendingUp, AlertTriangle, CheckCircle, HardDrive,
  Lock, Eye, FileText, BarChart3, Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFiles: 0,
    storageUsed: 0,
    securityScore: 95,
    activeUsers: 1
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Simulate loading stats and activities
    setStats({
      totalFiles: 247,
      storageUsed: 68,
      securityScore: 95,
      activeUsers: 12
    });
    
    setActivities([
      { id: 1, type: 'upload', message: 'New file uploaded: project-docs.pdf', time: '2 minutes ago', icon: Upload },
      { id: 2, type: 'security', message: 'Security scan completed successfully', time: '15 minutes ago', icon: Shield },
      { id: 3, type: 'user', message: 'New user registered', time: '1 hour ago', icon: User },
      { id: 4, type: 'database', message: 'Database backup completed', time: '2 hours ago', icon: Database }
    ]);
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const handleParallaxMove = (e) => {
    const cards = document.querySelectorAll('.parallax-card');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    cards.forEach((card, index) => {
      const speed = (index + 1) * 0.5;
      card.style.transform = `translateX(${x * speed}px) translateY(${y * speed}px)`;
    });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="dashboard" onMouseMove={handleParallaxMove}>
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem' }}>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}
          >
            🔥 FirestoreX
          </motion.h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
              <User size={20} />
              <span>{user?.user_metadata?.username || user?.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '2rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>Welcome back!</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>Here's your FirestoreX dashboard overview</p>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="stats-grid">
          <motion.div className="stat-card parallax-card" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Total Files</p>
                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>{stats.totalFiles}</h3>
              </div>
              <FileText size={32} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>+12% from last month</span>
            </div>
          </motion.div>
          
          <motion.div className="stat-card parallax-card" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Storage Used</p>
                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>{stats.storageUsed}%</h3>
              </div>
              <HardDrive size={32} color="rgba(255,255,255,0.8)" />
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.storageUsed}%` }}></div>
            </div>
          </motion.div>
          
          <motion.div className="stat-card parallax-card" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Security Score</p>
                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>{stats.securityScore}%</h3>
              </div>
              <Shield size={32} color="#10b981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>Excellent security</span>
            </div>
          </motion.div>
          
          <motion.div className="stat-card parallax-card" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Active Users</p>
                <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>{stats.activeUsers}</h3>
              </div>
              <User size={32} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={16} color="#06b6d4" />
              <span style={{ color: '#06b6d4', fontSize: '0.9rem' }}>Online now</span>
            </div>
          </motion.div>
        </div>
        
        {/* Parallax Image Section */}
        <motion.div 
          className="parallax-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="parallax-image"></div>
          <div className="parallax-overlay">
            <div>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Secure Cloud Storage</h3>
              <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </motion.div>
        
        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>          
          {/* Chart Container */}
          <motion.div 
            className="chart-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Usage Analytics</h3>
              <BarChart3 size={24} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chart visualization would go here</p>
            </div>
          </motion.div>
          
          {/* Activity Feed */}
          <motion.div 
            className="activity-feed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</h3>
            {activities.map((activity, index) => (
              <motion.div 
                key={activity.id}
                className="activity-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="activity-icon">
                  <activity.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', margin: 0, fontSize: '0.9rem' }}>{activity.message}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Security & Storage Grid */}
        <div className="security-grid">
          <motion.div 
            className="security-card success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Lock size={24} color="#10b981" />
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Security Status</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>All security checks passed. Your data is fully protected.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Encrypted</span>
              <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Backed Up</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="security-card warning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color="#f59e0b" />
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Storage Alert</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>You're using 68% of your storage. Consider upgrading your plan.</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>Upgrade Plan</button>
          </motion.div>
          
          <motion.div 
            className="security-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Settings size={24} color="rgba(255,255,255,0.8)" />
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Upload size={16} /> Upload Files
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Shield size={16} /> Security Scan
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Database size={16} /> Backup Data
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}