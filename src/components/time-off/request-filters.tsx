import { Select } from '@/components/ui/select';

interface RequestFiltersProps {
  typeFilter: string;
  statusFilter: string;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export function RequestFilters({
  typeFilter,
  statusFilter,
  onTypeFilterChange,
  onStatusFilterChange,
}: RequestFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="w-full">
        <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <Select
          id="typeFilter"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="w-full"
        >
          <option value="">All Types</option>
          <option value="days_off">Days Off</option>
          <option value="hours_off">Hours Off</option>
          <option value="sick_leave">Sick Leave</option>
        </Select>
      </div>

      <div className="w-full">
        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <Select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </Select>
      </div>
    </div>
  );
}