import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';

export async function getUserData(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as Omit<User, 'id'>;
    return {
      id: firebaseUser.uid,
      ...userData,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export function getRedirectPath(systemRole: string[]): string {
  if (systemRole.includes('admin')) {
    return '/admin';
  }
  if (systemRole.includes('employee')) {
    return '/employee';
  }
  return '/login';
}