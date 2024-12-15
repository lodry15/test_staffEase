import { createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { getUserData } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}