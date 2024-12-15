import { AdminLayout } from '@/components/layouts/admin-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AvailabilityChart } from '@/components/dashboard/availability-chart';
import { ShortageTable } from '@/components/dashboard/shortage-table';
import { Users, Clock, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminRequestStats } from '@/hooks/use-admin-request-stats';
import { useEmployeeStats } from '@/hooks/use-employee-stats';
import { useAvailableStaff } from '@/hooks/use-available-staff';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { pendingCount, loading: requestsLoading, error: requestsError } = useAdminRequestStats();
  const { totalCount, loading: employeesLoading, error: employeesError } = useEmployeeStats();
  const { availableStaff, totalEmployees, loading: staffLoading, error: staffError } = useAvailableStaff();

  const handlePendingRequestsClick = () => {
    navigate('/admin/time-off-requests', {
      state: { initialFilter: { status: 'pending' } }
    });
  };

  // Calculate percentage of available staff
  const availablePercentage = totalEmployees > 0 
    ? Math.round((availableStaff / totalEmployees) * 100) 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your organization's time-off management
          </p>
        </div>

        {/* First Row: KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Pending Requests"
            value={requestsLoading ? '...' : pendingCount}
            description="Awaiting approval"
            icon={Clock}
            clickable={true}
            onClick={handlePendingRequestsClick}
            error={requestsError}
          />
          <StatsCard
            title="Total Employees"
            value={employeesLoading ? '...' : totalCount}
            description="Active employees"
            icon={Users}
            error={employeesError}
          />
          <StatsCard
            title="Available Staff"
            value={staffLoading ? '...' : availableStaff}
            description="Currently working"
            icon={UserCheck}
            trend={{
              value: `${availablePercentage}% of total`,
              positive: availablePercentage >= 80
            }}
            error={staffError}
          />
        </div>

        {/* Second Row: Availability Chart */}
        <AvailabilityChart />

        {/* Third Row: Shortage Table */}
        <ShortageTable />
      </div>
    </AdminLayout>
  );
}