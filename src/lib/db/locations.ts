import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Location } from '@/types';

export async function getLocations(): Promise<Location[]> {
  const locationsRef = collection(db, 'locations');
  const q = query(locationsRef, orderBy('createdAt', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Location));
}

export async function createLocation(name: string, createdById: string): Promise<{ id: string }> {
  try {
    const locationsRef = collection(db, 'locations');
    
    // Check if location name already exists
    const nameCheck = query(locationsRef, where('name', '==', name));
    const existingLocations = await getDocs(nameCheck);
    
    if (!existingLocations.empty) {
      throw new Error('A location with this name already exists');
    }
    
    const docRef = await addDoc(locationsRef, {
      name,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id };
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}

export async function updateLocation(id: string, name: string): Promise<void> {
  const locationsRef = collection(db, 'locations');
  
  // Check if new name conflicts with existing locations
  const nameCheck = query(locationsRef, where('name', '==', name));
  const existingLocations = await getDocs(nameCheck);
  
  if (!existingLocations.empty && existingLocations.docs[0].id !== id) {
    throw new Error('A location with this name already exists');
  }
  
  const locationRef = doc(db, 'locations', id);
  await updateDoc(locationRef, { name });
}

export async function deleteLocation(id: string): Promise<void> {
  // Check if location is assigned to any users
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('locationId', '==', doc(db, 'locations', id)));
  const assignedUsers = await getDocs(q);
  
  if (!assignedUsers.empty) {
    throw new Error('This location cannot be deleted as it is currently assigned to employees');
  }
  
  const locationRef = doc(db, 'locations', id);
  await deleteDoc(locationRef);
}