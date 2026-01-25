import { useState } from 'react';
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
      return <Login onToggle={() => setCurrentView('register')} />;
    case 'register':
      return <Register onToggle={() => setCurrentView('login')} />;
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
    </AuthProvider>
  );
}
