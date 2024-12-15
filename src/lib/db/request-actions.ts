import { doc, updateDoc, serverTimestamp, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { differenceInDays } from 'date-fns';

interface RequestAction {
  requestId: string;
  adminId: string;
}

async function updateLeaveBalance(requestId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get the request document
      const requestRef = doc(db, 'requests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      const { userId, startDate, endDate, type, hoursOff } = requestData;

      // Get the user document
      const userDoc = await transaction.get(userId);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Calculate the deduction based on request type
      if (type === 'hours_off') {
        // Update hours balance
        const newHoursBalance = Math.max(0, userData.hoursAvailable - hoursOff);
        transaction.update(userId, { hoursAvailable: newHoursBalance });
      } else {
        // Calculate days for 'days_off' and 'sick_leave'
        const start = new Date(startDate.seconds * 1000);
        const end = new Date(endDate.seconds * 1000);
        const daysOff = differenceInDays(end, start) + 1; // Include both start and end dates
        
        // Update days balance
        const newDaysBalance = Math.max(0, userData.daysAvailable - daysOff);
        transaction.update(userId, { daysAvailable: newDaysBalance });
      }
    });

    console.log('Leave balance updated successfully');
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw new Error('Failed to update leave balance');
  }
}

export async function approveRequest({ requestId, adminId }: RequestAction): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    
    // First update the request status
    await updateDoc(requestRef, {
      status: 'approved',
      processedBy: doc(db, 'users', adminId),
      processedAt: serverTimestamp(),
    });

    // Then update the leave balance
    await updateLeaveBalance(requestId);
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
}

export async function denyRequest({ requestId, adminId }: RequestAction): Promise<void> {
  const requestRef = doc(db, 'requests', requestId);
  await updateDoc(requestRef, {
    status: 'denied',
    processedBy: doc(db, 'users', adminId),
    processedAt: serverTimestamp(),
  });
}