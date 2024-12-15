import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  initializeAuth,
  browserLocalPersistence,
  deleteUser
} from 'firebase/auth';
import { db } from '../firebase';
import { CreateEmployeeData, UpdateEmployeeData, Employee } from '@/types';
import { generateTemporaryPassword } from '../utils/password';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';

// Create a separate Firebase app instance for employee operations
const employeeApp = initializeApp(firebaseConfig, 'employeeApp');
const employeeAuth = initializeAuth(employeeApp, {
  persistence: browserLocalPersistence
});

export async function getEmployees(): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, 'users');
    const querySnapshot = await getDocs(employeesRef);
    
    const employees = await Promise.all(
      querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return Array.isArray(data.systemRole) && data.systemRole.includes('employee');
        })
        .map(async (doc) => {
          const data = doc.data();
          
          try {
            const [roleDoc, locationDoc] = await Promise.all([
              getDoc(data.roleId),
              getDoc(data.locationId)
            ]);

            return {
              id: doc.id,
              ...data,
              roleName: roleDoc.exists() ? roleDoc.data()?.name : 'Unknown Role',
              locationName: locationDoc.exists() ? locationDoc.data()?.name : 'Unknown Location',
            } as Employee;
          } catch (error) {
            console.error(`Error fetching references for employee ${doc.id}:`, error);
            return {
              id: doc.id,
              ...data,
              roleName: 'Unknown Role',
              locationName: 'Unknown Location',
            } as Employee;
          }
        })
    );

    return employees.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Error in getEmployees:', error);
    throw error;
  }
}

export async function createEmployee(
  data: CreateEmployeeData,
  createdById: string
): Promise<void> {
  const { roleId, locationId, email, ...rest } = data;

  // Validate numeric fields
  const numericFields = ['daysAvailable', 'hoursAvailable', 'annualDays', 'annualHours'];
  for (const field of numericFields) {
    const value = rest[field as keyof typeof rest];
    if (typeof value !== 'number' || value < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  // Verify role and location exist
  const [roleDoc, locationDoc] = await Promise.all([
    getDoc(doc(db, 'roles', roleId)),
    getDoc(doc(db, 'locations', locationId))
  ]);

  if (!roleDoc.exists()) {
    throw new Error('Selected role does not exist');
  }

  if (!locationDoc.exists()) {
    throw new Error('Selected location does not exist');
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();

  try {
    // Create new user with employee auth instance
    const userCredential = await createUserWithEmailAndPassword(
      employeeAuth,
      email,
      temporaryPassword
    );

    // Create employee document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...rest,
      email,
      roleId: doc(db, 'roles', roleId),
      locationId: doc(db, 'locations', locationId),
      systemRole: ['employee'],
      temporaryPassword,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    // Sign out from employee auth
    await signOut(employeeAuth);
  } catch (error: any) {
    // Clean up employee auth session if something fails
    await signOut(employeeAuth);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists');
    }
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData
): Promise<void> {
  const { roleId, locationId, ...rest } = data;
  const employeeRef = doc(db, 'users', id);

  // Validate numeric fields
  const numericFields = ['daysAvailable', 'hoursAvailable', 'annualDays', 'annualHours'];
  for (const field of numericFields) {
    const value = rest[field as keyof typeof rest];
    if (typeof value !== 'number' || value < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  // Verify role and location exist
  const [roleDoc, locationDoc] = await Promise.all([
    getDoc(doc(db, 'roles', roleId)),
    getDoc(doc(db, 'locations', locationId))
  ]);

  if (!roleDoc.exists()) {
    throw new Error('Selected role does not exist');
  }

  if (!locationDoc.exists()) {
    throw new Error('Selected location does not exist');
  }

  // Only include fields that should be updated
  const updates = {
    ...rest,
    roleId: doc(db, 'roles', roleId),
    locationId: doc(db, 'locations', locationId),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(employeeRef, updates);
}

export async function deleteEmployee(id: string): Promise<void> {
  try {
    // Get employee data to check for dependencies
    const employeeRef = doc(db, 'users', id);
    const employeeDoc = await getDoc(employeeRef);
    
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();

    // Check for active time-off requests
    const requestsRef = collection(db, 'requests');
    const activeRequestsQuery = query(
      requestsRef,
      where('userId', '==', employeeRef),
      where('status', '==', 'pending')
    );
    const activeRequests = await getDocs(activeRequestsQuery);

    if (!activeRequests.empty) {
      throw new Error('Cannot delete employee with pending time-off requests');
    }

    // Sign in to employee auth to delete the auth account
    try {
      // Try to sign in with employee credentials
      const userCredential = await signInWithEmailAndPassword(
        employeeAuth,
        employeeData.email,
        employeeData.temporaryPassword || 'dummy-password'
      );

      // Delete the auth account
      await deleteUser(userCredential.user);
    } catch (authError) {
      console.error('Error deleting auth account:', authError);
      // Continue with Firestore deletion even if auth deletion fails
      // The auth account might have been already deleted or credentials changed
    } finally {
      // Always sign out from employee auth
      await signOut(employeeAuth);
    }

    // Delete the Firestore document
    await deleteDoc(employeeRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
}