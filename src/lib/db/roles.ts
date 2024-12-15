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
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Role } from '@/types';

export async function getRoles(): Promise<Role[]> {
  const rolesRef = collection(db, 'roles');
  const q = query(rolesRef, orderBy('createdAt', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Role));
}

export async function createRole(name: string, createdById: string): Promise<{ id: string }> {
  try {
    const rolesRef = collection(db, 'roles');
    
    // Check if role name already exists
    const nameCheck = query(rolesRef, where('name', '==', name));
    const existingRoles = await getDocs(nameCheck);
    
    if (!existingRoles.empty) {
      throw new Error('A role with this name already exists');
    }
    
    const docRef = await addDoc(rolesRef, {
      name,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id };
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}

export async function updateRole(id: string, name: string): Promise<void> {
  const rolesRef = collection(db, 'roles');
  
  // Check if new name conflicts with existing roles
  const nameCheck = query(rolesRef, where('name', '==', name));
  const existingRoles = await getDocs(nameCheck);
  
  if (!existingRoles.empty && existingRoles.docs[0].id !== id) {
    throw new Error('A role with this name already exists');
  }
  
  const roleRef = doc(db, 'roles', id);
  await updateDoc(roleRef, { name });
}

export async function deleteRole(id: string): Promise<void> {
  // Check if role is assigned to any users
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('roleId', '==', doc(db, 'roles', id)));
  const assignedUsers = await getDocs(q);
  
  if (!assignedUsers.empty) {
    throw new Error('This role cannot be deleted as it is currently assigned to employees');
  }
  
  const roleRef = doc(db, 'roles', id);
  await deleteDoc(roleRef);
}