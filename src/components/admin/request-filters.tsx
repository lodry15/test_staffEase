import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLocations } from '@/lib/db/locations';

interface RequestFiltersProps {
  onFilterChange: (filters: {
    search: string;
    type: string;
    status: string;
    location: string;
  }) => void;
}

export function RequestFilters({ onFilterChange }: RequestFiltersProps) {
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    location: '',
  });

  useEffect(() => {
    async function loadLocations() {
      try {
        const fetchedLocations = await getLocations();
        setLocations(fetchedLocations);
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    }
    loadLocations();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search employee..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="days_off">Days Off</option>
          <option value="hours_off">Hours Off</option>
          <option value="sick_leave">Sick Leave</option>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </Select>

        {/* Location Filter */}
        <Select
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}