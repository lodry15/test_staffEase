import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { EmployeeLayout } from '@/components/layouts/employee-layout';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock } from 'lucide-react';
import { RequestForm } from '@/components/time-off/request-form';
import { createRequest } from '@/lib/db/requests';
import { Calendar } from '@/components/calendar/calendar';
import { useEmployeeRequestStats } from '@/hooks/use-employee-request-stats';

export function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { pendingCount, loading, error } = useEmployeeRequestStats(user?.id);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const handleRequestSubmit = async (data: any) => {
    if (!user?.id) return;
    await createRequest(user.id, data);
  };

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.firstName}
            </p>
          </div>

          <Button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center transition-transform duration-200 hover:scale-105"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Send a New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Requests Box */}
          <div className="bg-white overflow-hidden rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-brand-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Requests
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {loading ? '...' : pendingCount}
                  </p>
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          {/* Balance Days Box */}
          <div className="bg-white overflow-hidden rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-brand-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Balance Days
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {user?.daysAvailable || 0} Days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Hours Box */}
          <div className="bg-white overflow-hidden rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-brand-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Balance Hours
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {user?.hoursAvailable || 0} Hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user?.id && <Calendar userId={user.id} />}
      </div>

      <RequestForm
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        daysAvailable={user?.daysAvailable || 0}
        hoursAvailable={user?.hoursAvailable || 0}
      />
    </EmployeeLayout>
  );
}