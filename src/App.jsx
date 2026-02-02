import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard, LandingPage, Login, Register } from './components/features';
import { LoadingSpinner } from './components/ui';
import './styles.css';

function AuthWrapper() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Dashboard />;
  }

  switch (currentView) {
    case 'login':
      return <Login onToggle={() => setCurrentView('register')} onBack={() => setCurrentView('landing')} />;
    case 'register':
      return <Register onToggle={() => setCurrentView('login')} onBack={() => setCurrentView('landing')} />;
    default:
      return (
        <LandingPage
          onGetStarted={() => setCurrentView('register')}
          onLogin={() => setCurrentView('login')}
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
