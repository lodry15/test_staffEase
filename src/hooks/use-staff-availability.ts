import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface DailyAvailability {
  date: Date;
  percentage: number;
  totalEmployees: number;
  availableStaff: number;
  locationName?: string;
}

export function useStaffAvailability(selectedMonth: Date, locationId?: string) {
  const [data, setData] = useState<DailyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function calculateAvailability() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Calculate Total Employees
        const usersRef = collection(db, 'users');
        let employeesQuery = query(
          usersRef,
          where('systemRole', 'array-contains', 'employee')
        );

        if (locationId) {
          const locationRef = doc(db, 'locations', locationId);
          employeesQuery = query(
            employeesQuery,
            where('locationId', '==', locationRef)
          );
        }

        const employeesSnapshot = await getDocs(employeesQuery);
        const totalEmployees = employeesSnapshot.size;

        if (totalEmployees === 0) {
          setData([]);
          return;
        }

        // Get location name if locationId is provided
        let selectedLocationName = 'All Locations';
        if (locationId) {
          const locationDoc = await getDoc(doc(db, 'locations', locationId));
          if (locationDoc.exists()) {
            selectedLocationName = locationDoc.data().name;
          }
        }

        // Step 2: Get all approved requests
        const requestsRef = collection(db, 'requests');
        const requestsQuery = query(
          requestsRef,
          where('status', '==', 'approved')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Create a map of employee IDs to their location names
        const employeeLocations = new Map();
        for (const empDoc of employeesSnapshot.docs) {
          const empData = empDoc.data();
          if (empData.locationId) {
            const locationDoc = await getDoc(empData.locationId);
            if (locationDoc.exists()) {
              employeeLocations.set(empDoc.id, locationDoc.data().name);
            }
          }
        }

        // Step 3: Calculate availability for each day of the month
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const availability = await Promise.all(daysInMonth.map(async date => {
          // Count employees on leave for this specific day
          const onLeaveToday = requestsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const startDate = data.startDate.toDate();
            const endDate = data.endDate ? data.endDate.toDate() : startDate;

            // Check if the employee belongs to the selected location
            if (locationId) {
              const employeeDoc = employeesSnapshot.docs.find(emp => 
                emp.id === data.userId.id
              );
              if (!employeeDoc) return false;
            }

            // Check if the date falls within the leave period
            return (startDate <= date && endDate >= date);
          });

          const availableStaff = Math.max(0, totalEmployees - onLeaveToday.length);
          const percentage = Math.round((availableStaff / totalEmployees) * 100);

          return {
            date,
            percentage,
            totalEmployees,
            availableStaff,
            locationName: selectedLocationName
          };
        }));

        setData(availability);
      } catch (err) {
        console.error('Error calculating staff availability:', err);
        setError('Failed to load availability data');
      } finally {
        setLoading(false);
      }
    }

    calculateAvailability();
  }, [selectedMonth, locationId]);

  return { data, loading, error };
}