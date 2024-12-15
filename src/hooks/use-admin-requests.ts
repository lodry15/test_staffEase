import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminRequest {
  id: string;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: { seconds: number };
  status: 'pending' | 'approved' | 'denied';
  employeeName: string;
  locationName: string;
  userId: any;
  locationId: string;
}

interface Filters {
  search: string;
  type: string;
  status: string;
  location: string;
}

export function useAdminRequests(filters?: Filters) {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(requestsRef);

    const unsubscribe = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        try {
          const requestsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              let employeeName = 'Unknown';
              let locationName = 'Unknown Location';
              let locationId = '';

              const userId = data.userId;

              if (userId) {
                try {
                  const userDoc = await getDoc(userId);
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    employeeName = `${userData.firstName} ${userData.lastName}`;

                    if (userData.locationId) {
                      const locationDoc = await getDoc(userData.locationId);
                      if (locationDoc.exists()) {
                        locationName = locationDoc.data().name;
                        locationId = locationDoc.id;
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error fetching user or location details:', error);
                }
              }

              return {
                id: doc.id,
                ...data,
                employeeName,
                locationName,
                userId,
                locationId,
              };
            })
          );

          setAllRequests(requestsData);
          setError(null);
        } catch (err) {
          console.error('Error processing requests:', err);
          setError('Failed to load requests');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!filters) {
      setRequests(allRequests);
      return;
    }

    let filteredRequests = [...allRequests];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredRequests = filteredRequests.filter(request =>
        request.employeeName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply type filter
    if (filters.type) {
      filteredRequests = filteredRequests.filter(request =>
        request.type === filters.type
      );
    }

    // Apply status filter
    if (filters.status) {
      filteredRequests = filteredRequests.filter(request =>
        request.status === filters.status
      );
    }

    // Apply location filter
    if (filters.location) {
      filteredRequests = filteredRequests.filter(request =>
        request.locationId === filters.location
      );
    }

    // Sort by start date (newest first)
    filteredRequests.sort((a, b) => b.startDate.seconds - a.startDate.seconds);

    setRequests(filteredRequests);
  }, [filters, allRequests]);

  return { requests, loading, error };
}