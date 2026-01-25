import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Users, Database, Cloud, Lock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage({ onGetStarted, onLogin }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const parallaxStyle = {
    transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
  };

  return (
    <div className="landing">
      {/* Floating Elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        ...parallaxStyle,
        zIndex: 0
      }} />
      
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'rgba(6,182,212,0.2)',
        borderRadius: '50%',
        transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
        zIndex: 0
      }} />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div className="hero-text" variants={fadeInUp}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
              >
                <Sparkles size={32} color="#06b6d4" />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', fontWeight: '500' }}>FirestoreX Platform</span>
              </motion.div>
              
              <h1>
                Build Amazing Apps with 
                <span style={{ 
                  background: 'linear-gradient(135deg, #06b6d4 0%, #f093fb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}> FirestoreX</span>
              </h1>
              <p>
                The next-generation Firebase alternative with enhanced security, real-time capabilities, 
                and enterprise-grade performance. Build faster, scale better, secure everything.
              </p>
              <div className="cta-buttons">
                <motion.button 
                  className="btn btn-primary" 
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started <ArrowRight size={20} />
                </motion.button>
                <motion.button 
                  className="btn btn-secondary" 
                  onClick={onLogin}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </div>
              
              {/* Trust Indicators */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Shield size={20} color="#10b981" />
                  <span>Enterprise Security</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Zap size={20} color="#f59e0b" />
                  <span>Lightning Fast</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Cloud size={20} color="#06b6d4" />
                  <span>99.9% Uptime</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Enhanced Hero Visual */}
            <motion.div 
              className="hero-visual"
              variants={fadeInUp}
              transition={{ delay: 0.3 }}
              style={{ position: 'relative' }}
            >
              {/* Main Card */}
              <div className="floating-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <Database size={48} color="#06b6d4" />
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Real-time Database</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0 }}>
                      Instant APIs and real-time subscriptions
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Active</span>
                  <span style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Synced</span>
                </div>
              </div>
              
              {/* Secondary Cards */}
              <motion.div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem',
                  transform: `translate(${mousePosition.x * 0.005}px, ${mousePosition.y * 0.005}px)`
                }}
              >
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)', 
                  borderRadius: '0.75rem', 
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Lock size={24} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>Secure Auth</p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)', 
                  borderRadius: '0.75rem', 
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Cloud size={24} color="#06b6d4" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>Cloud Storage</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <motion.section 
        className="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>Why Choose FirestoreX?</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Built for modern applications with enterprise-grade security and performance
            </p>
          </motion.div>
          
          <motion.div 
            className="features-grid"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Enterprise Security</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>Advanced encryption, MFA, and row-level security with compliance certifications.</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>SOC 2</span>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>GDPR</span>
              </div>
            </motion.div>
            
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon" style={{ background: 'var(--gradient-success)' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Lightning Performance</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>Sub-millisecond response times with global CDN and edge computing capabilities.</p>
              <div style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: '600' }}>
                <span>⚡ 99.9% Uptime SLA</span>
              </div>
            </motion.div>
            
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon" style={{ background: 'var(--gradient-accent)' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Team Collaboration</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>Advanced team management with granular permissions and real-time collaboration.</p>
              <div style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: '600' }}>
                <span>👥 Unlimited team members</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}