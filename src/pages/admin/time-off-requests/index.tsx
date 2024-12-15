import { useState } from 'react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { useAuthStore } from '@/store/auth';
import { useAdminRequests } from '@/hooks/use-admin-requests';
import { useToast } from '@/hooks/use-toast';
import { RequestDetailsModal } from '@/components/admin/request-details-modal';
import { RequestFilters } from '@/components/admin/request-filters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Check, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { approveRequest, denyRequest } from '@/lib/db/request-actions';
import { prepareRequestsForExport } from '@/lib/utils/export-requests';
import { exportToCSV } from '@/lib/utils/csv-export';

const requestTypeLabels = {
  days_off: 'Days Off',
  hours_off: 'Hours Off',
  sick_leave: 'Sick Leave',
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  denied: 'bg-red-50 text-red-700 border-red-200',
};

export function TimeOffRequestsPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    location: '',
  });
  const { requests, loading, error } = useAdminRequests(filters);
  const { toasts, addToast, removeToast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'deny';
    requestId: string | null;
  }>({
    open: false,
    type: 'approve',
    requestId: null,
  });
  const [processing, setProcessing] = useState(false);

  const handleExport = async () => {
    try {
      const data = await prepareRequestsForExport();
      const filename = `time-off-requests-${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCSV(data, filename);
      addToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Failed to export data', 'error');
    }
  };

  const handleAction = (type: 'approve' | 'deny', requestId: string) => {
    setConfirmDialog({
      open: true,
      type,
      requestId,
    });
  };

  const handleConfirmAction = async () => {
    if (!user?.id || !confirmDialog.requestId) return;

    setProcessing(true);
    try {
      if (confirmDialog.type === 'approve') {
        await approveRequest({
          requestId: confirmDialog.requestId,
          adminId: user.id,
        });
        addToast('Request approved successfully', 'success');
      } else {
        await denyRequest({
          requestId: confirmDialog.requestId,
          adminId: user.id,
        });
        addToast('Request denied successfully', 'success');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      addToast('Failed to process request', 'error');
    } finally {
      setProcessing(false);
      setConfirmDialog({ open: false, type: 'approve', requestId: null });
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Time-Off Requests</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage employee time-off requests
            </p>
          </div>
          
          <Button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center transition-transform duration-200 hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <RequestFilters onFilterChange={setFilters} />

        {error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.employeeName}
                    </TableCell>
                    <TableCell>
                      {requestTypeLabels[request.type]}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate.seconds * 1000), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{request.locationName}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 rounded-md text-xs font-medium border',
                          statusStyles[request.status]
                        )}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('approve', request.id)}
                            className="hover:bg-green-50 transition-colors duration-200"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('deny', request.id)}
                            className="hover:bg-red-50 transition-colors duration-200"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction('deny', request.id)}
                          className="hover:bg-red-50 transition-colors duration-200"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={6} 
                      className="text-center text-gray-500 py-8"
                    >
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <RequestDetailsModal
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: 'approve', requestId: null })}
          onConfirm={handleConfirmAction}
          title={`${confirmDialog.type === 'approve' ? 'Approve' : 'Deny'} Request`}
          message={`Are you sure you want to ${confirmDialog.type} this request?`}
          confirmText={confirmDialog.type === 'approve' ? 'Approve' : 'Deny'}
          isDestructive={confirmDialog.type === 'deny'}
          loading={processing}
        />

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </AdminLayout>
  );
}