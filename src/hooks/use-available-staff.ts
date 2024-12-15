import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface AvailableStaffStats {
  totalEmployees: number;
  availableStaff: number;
  loading: boolean;
  error: string | null;
}

export function useAvailableStaff() {
  const [stats, setStats] = useState<AvailableStaffStats>({
    totalEmployees: 0,
    availableStaff: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function calculateAvailableStaff() {
      try {
        // Step 1: Calculate Total Employees
        const usersRef = collection(db, 'users');
        const employeesQuery = query(
          usersRef,
          where('systemRole', 'array-contains', 'employee')
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const totalEmployees = employeesSnapshot.size;

        if (totalEmployees === 0) {
          setStats({
            totalEmployees: 0,
            availableStaff: 0,
            loading: false,
            error: null
          });
          return;
        }

        // Step 2: Get all approved requests
        const requestsRef = collection(db, 'requests');
        const requestsQuery = query(
          requestsRef,
          where('status', '==', 'approved')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Step 3: Filter requests that overlap with today in memory
        const today = startOfDay(new Date()); // Use start of day for comparison

        const onLeaveToday = requestsSnapshot.docs.filter(doc => {
          const data = doc.data();
          const startDate = startOfDay(data.startDate.toDate());
          const endDate = data.endDate 
            ? startOfDay(data.endDate.toDate())
            : startDate;

          // Check if today falls within the leave period (inclusive)
          return (
            (startDate <= today && endDate >= today) ||
            (startDate.getTime() === today.getTime()) ||
            (endDate.getTime() === today.getTime())
          );
        }).length;

        // Step 4: Calculate Available Staff
        const availableStaff = Math.max(0, totalEmployees - onLeaveToday);

        setStats({
          totalEmployees,
          availableStaff,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error calculating available staff:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to calculate available staff'
        }));
      }
    }

    calculateAvailableStaff();
  }, []);

  return stats;
}