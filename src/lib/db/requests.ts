import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentReference,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

interface RequestData {
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: string;
  endDate?: string;
  hours?: string;
  notes?: string;
}

interface StoredRequest {
  userId: DocumentReference;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: Date;
  endDate?: Date;
  hoursOff?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
}

export async function createRequest(userId: string, data: RequestData): Promise<void> {
  try {
    // Create a reference to the user document
    const userRef = doc(db, 'users', userId);
    
    // Prepare request data
    const requestData: StoredRequest = {
      userId: userRef, // Store as document reference
      type: data.type,
      startDate: new Date(data.startDate),
      status: 'pending',
      createdAt: serverTimestamp(),
      notes: data.notes,
    };

    // Add type-specific fields
    if (data.type === 'days_off' || data.type === 'sick_leave') {
      requestData.endDate = data.endDate ? new Date(data.endDate) : new Date(data.startDate);
    } else if (data.type === 'hours_off' && data.hours) {
      requestData.hoursOff = Number(data.hours);
    }

    // Save request to Firestore
    await addDoc(collection(db, 'requests'), requestData);
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequest(requestId: string, data: RequestData): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    
    // Convert dates to Date objects
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : new Date(data.startDate);

    // Base update data
    const updateData: any = {
      type: data.type,
      startDate,
      notes: data.notes,
      status: 'pending', // Reset status to pending on update
    };

    // Add type-specific fields
    if (data.type === 'days_off' || data.type === 'sick_leave') {
      updateData.endDate = endDate;
      updateData.hoursOff = null; // Clear hours when switching to days
    } else if (data.type === 'hours_off') {
      updateData.hoursOff = data.hours ? Number(data.hours) : 0;
      updateData.endDate = null; // Clear end date when switching to hours
    }

    // Update request in Firestore
    await updateDoc(requestRef, updateData);
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

export async function deleteRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
}