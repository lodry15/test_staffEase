import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Calendar } from 'lucide-react';
import { EmployeeLayout } from '@/components/layouts/employee-layout';
import { Button } from '@/components/ui/button';
import { RequestForm } from '@/components/time-off/request-form';
import { RequestDetailsModal } from '@/components/time-off/request-details-modal';
import { RequestFilters } from '@/components/time-off/request-filters';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth';
import { useTimeOffRequests } from '@/hooks/use-time-off-requests';
import { createRequest } from '@/lib/db/requests';
import { cn } from '@/lib/utils';

const requestTypeLabels = {
  days_off: 'Days Off',
  hours_off: 'Hours Off',
  sick_leave: 'Sick Leave',
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  denied: 'bg-red-50 text-red-700',
};

export function EmployeeTimeOffRequestsPage() {
  const { user } = useAuthStore();
  const { requests, loading, error } = useTimeOffRequests(user?.id);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredRequests = (requests || []).filter(request => {
    if (typeFilter && request.type !== typeFilter) return false;
    if (statusFilter && request.status !== statusFilter) return false;
    return true;
  });

  const handleRequestSubmit = async (data: any) => {
    if (!user?.id) return;
    await createRequest(user.id, data);
    setIsRequestModalOpen(false);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading requests...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout>
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-4 max-w-full px-2 sm:px-0">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Time-Off Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage your time-off requests
            </p>
          </div>

          <Button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center text-sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Send a New Request
          </Button>
        </div>

        <div className="w-full">
          <RequestFilters
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onTypeFilterChange={setTypeFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm -mx-2 sm:mx-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs">Start</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {request.createdAt ? format(new Date(request.createdAt.seconds * 1000), 'MMM d') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {request.startDate ? format(new Date(request.startDate.seconds * 1000), 'MMM d') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {requestTypeLabels[request.type]}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        statusStyles[request.status]
                      )}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="hover:bg-gray-100 p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-sm">
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <RequestForm
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        daysAvailable={user?.daysAvailable || 0}
        hoursAvailable={user?.hoursAvailable || 0}
      />

      <RequestDetailsModal
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </EmployeeLayout>
  );
}