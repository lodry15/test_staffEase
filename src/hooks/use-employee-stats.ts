import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmployeeStats {
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export function useEmployeeStats() {
  const [stats, setStats] = useState<EmployeeStats>({
    totalCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const employeesQuery = query(
      usersRef,
      where('systemRole', 'array-contains', 'employee')
    );

    const unsubscribe = onSnapshot(
      employeesQuery,
      (snapshot) => {
        setStats({
          totalCount: snapshot.size,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error('Error fetching employee stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load employee statistics'
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  return stats;
}