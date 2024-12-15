import { collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

interface ExportableRequest {
  id: string;
  employeeName: string;
  email: string;
  roleName: string;
  locationName: string;
  type: string;
  startDate: string;
  endDate?: string;
  hoursOff?: number;
  status: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export async function prepareRequestsForExport(): Promise<ExportableRequest[]> {
  try {
    const requestsRef = collection(db, 'requests');
    const snapshot = await getDocs(requestsRef);
    
    const requests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let employeeName = 'Unknown';
        let email = '';
        let roleName = 'Unknown Role';
        let locationName = 'Unknown Location';
        let processedByName = '';

        // Fetch employee details
        if (data.userId) {
          try {
            const userDoc = await getDoc(data.userId);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              employeeName = `${userData.firstName} ${userData.lastName}`;
              email = userData.email;

              // Fetch role details
              if (userData.roleId) {
                const roleDoc = await getDoc(userData.roleId);
                if (roleDoc.exists()) {
                  roleName = roleDoc.data().name;
                }
              }

              // Fetch location details
              if (userData.locationId) {
                const locationDoc = await getDoc(userData.locationId);
                if (locationDoc.exists()) {
                  locationName = locationDoc.data().name;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching employee details:', error);
          }
        }

        // Fetch processor details if request was processed
        if (data.processedBy) {
          try {
            const processorDoc = await getDoc(data.processedBy);
            if (processorDoc.exists()) {
              const processorData = processorDoc.data();
              processedByName = `${processorData.firstName} ${processorData.lastName}`;
            }
          } catch (error) {
            console.error('Error fetching processor details:', error);
          }
        }

        // Format dates
        const formatDate = (timestamp: any) => {
          if (!timestamp) return '';
          return format(new Date(timestamp.seconds * 1000), 'yyyy-MM-dd');
        };

        return {
          id: doc.id,
          employeeName,
          email,
          roleName,
          locationName,
          type: data.type,
          startDate: formatDate(data.startDate),
          endDate: formatDate(data.endDate),
          hoursOff: data.hoursOff,
          status: data.status,
          notes: data.notes || '',
          createdAt: formatDate(data.createdAt),
          processedAt: formatDate(data.processedAt),
          processedBy: processedByName,
        };
      })
    );

    // Sort by created date (newest first)
    return requests.sort((a, b) => 
      b.createdAt.localeCompare(a.createdAt)
    );
  } catch (error) {
    console.error('Error preparing requests for export:', error);
    throw new Error('Failed to prepare requests for export');
  }
}