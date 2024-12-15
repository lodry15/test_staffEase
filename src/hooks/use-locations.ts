import { useState, useEffect } from 'react';
import { getLocations } from '@/lib/db/locations';
import { Location } from '@/types';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await getLocations();
        setLocations(data);
        setError(null);
      } catch (err) {
        console.error('Error loading locations:', err);
        setError('Failed to load locations');
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, []);

  return { locations, loading, error };
}