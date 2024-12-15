import { useState, useEffect } from 'react';
import { useStaffAvailability } from './use-staff-availability';

interface ShortageDay {
  date: Date;
  employeesShort: number;
  locationName: string;
  totalEmployees: number;
}

export function useStaffShortage(selectedMonth: Date, locationId?: string) {
  const { data, loading, error } = useStaffAvailability(selectedMonth, locationId);
  const [shortages, setShortages] = useState<ShortageDay[]>([]);

  useEffect(() => {
    if (!data) return;

    // Filter days with less than 50% staff availability
    const shortageData = data
      .filter(day => day.percentage <= 50)
      .map(day => ({
        date: day.date,
        employeesShort: day.totalEmployees - day.availableStaff,
        locationName: day.locationName || 'All Locations',
        totalEmployees: day.totalEmployees
      }))
      // Sort by date ascending
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      // Take only top 5 shortage days
      .slice(0, 5);

    setShortages(shortageData);
  }, [data, locationId]);

  return { shortages, loading, error };
}