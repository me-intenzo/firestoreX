import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard, LandingPage, Login, Register, FeaturesPage, SharedFilePage } from './components/features';
import { LoadingSpinner } from './components/ui';
import './styles.css';

function AuthWrapper() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [postLoginShareToken, setPostLoginShareToken] = useState(() => sessionStorage.getItem('postLoginShareToken') || null);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!user || !postLoginShareToken) return;

    const targetPath = `/s/${postLoginShareToken}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    setPathname(targetPath);
    setPostLoginShareToken(null);
    sessionStorage.removeItem('postLoginShareToken');
  }, [user, postLoginShareToken]);

  const goToPath = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setPathname(path);
  };

  const goToLogin = () => {
    goToPath('/');
    setCurrentView('login');
  };

  const goToLanding = () => {
    goToPath('/');
    setCurrentView('landing');
  };

  const sharedToken = pathname.startsWith('/s/') ? pathname.slice(3).split('/')[0] : null;

  if (sharedToken) {
    return (
      <SharedFilePage
        token={sharedToken}
        user={user}
        authLoading={loading}
        onBackHome={goToLanding}
        onLogin={(token) => {
          if (token) {
            setPostLoginShareToken(token);
            sessionStorage.setItem('postLoginShareToken', token);
          }
          goToLogin();
        }}
        onOpenApp={() => {
          goToPath('/');
          setCurrentView(user ? 'landing' : 'login');
        }}
      />
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Dashboard />;
  }

  switch (currentView) {
    case 'login':
      return <Login onToggle={() => setCurrentView('register')} onBack={goToLanding} />;
    case 'register':
      return <Register onToggle={() => setCurrentView('login')} onBack={goToLanding} />;
    case 'features':
      return (
        <FeaturesPage
          onBack={goToLanding}
          onGetStarted={() => setCurrentView('register')}
          onLogin={() => setCurrentView('login')}
        />
      );
    default:
      return (
        <LandingPage
          onGetStarted={() => setCurrentView('register')}
          onLogin={() => setCurrentView('login')}
          onFeatures={() => setCurrentView('features')}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
      <Toaster position="top-center" richColors theme="dark" />
    </AuthProvider>
  );
}
