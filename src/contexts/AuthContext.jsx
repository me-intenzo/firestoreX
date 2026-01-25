import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      // Handle user registration - create profile if needed
      if (event === 'SIGNED_UP' && session?.user) {
        const { user } = session;
        const username = user.user_metadata?.username;
        
        if (username) {
          // Create or update user profile in a profiles table if you have one
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: username,
              email: user.email,
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('Error creating profile:', error);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}