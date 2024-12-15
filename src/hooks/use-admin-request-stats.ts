import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminRequestStats {
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

export function useAdminRequestStats() {
  const [stats, setStats] = useState<AdminRequestStats>({
    pendingCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const requestsRef = collection(db, 'requests');
    const pendingQuery = query(
      requestsRef,
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      pendingQuery,
      (snapshot) => {
        setStats({
          pendingCount: snapshot.size,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error('Error fetching admin request stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load request statistics'
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  return stats;
}