import { Timestamp, DocumentReference } from 'firebase/firestore';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  systemRole: string[];
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
  roleId: DocumentReference;
  locationId: DocumentReference;
  createdBy: DocumentReference;
  createdAt: Timestamp;
  temporaryPassword?: string;
}

export interface Employee extends User {
  roleName?: string;
  locationName?: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
}

export interface UpdateEmployeeData {
  firstName: string;
  lastName: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
}

export interface TimeOffRequest {
  id: string;
  userId: DocumentReference;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: Timestamp;
  endDate: Timestamp;
  daysOff: number;
  hoursOff: number;
  status: 'pending' | 'approved' | 'denied';
  adminId: DocumentReference;
  comments: string;
  createdAt: Timestamp;
}

export interface Role {
  id: string;
  name: string;
  createdBy: DocumentReference;
  createdAt: Timestamp;
}

export interface Location {
  id: string;
  name: string;
  createdBy: DocumentReference;
  createdAt: Timestamp;
}