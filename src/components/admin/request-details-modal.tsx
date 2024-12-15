import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { approveRequest, denyRequest } from '@/lib/db/request-actions';

interface RequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  request: any;
}

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

export function RequestDetailsModal({ open, onClose, request }: RequestDetailsModalProps) {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'deny';
  }>({
    open: false,
    type: 'approve',
  });

  useEffect(() => {
    async function fetchEmployeeDetails() {
      if (!request?.userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch employee details using the document reference
        const userDoc = await getDoc(request.userId);
        if (!userDoc.exists()) {
          throw new Error('Employee not found');
        }

        const userData = userDoc.data();
        
        // Fetch role and location details
        const [roleDoc, locationDoc] = await Promise.all([
          getDoc(userData.roleId),
          getDoc(userData.locationId)
        ]);

        setEmployeeDetails({
          ...userData,
          roleName: roleDoc.exists() ? roleDoc.data()?.name : 'Unknown Role',
          locationName: locationDoc.exists() ? locationDoc.data()?.name : 'Unknown Location'
        });
      } catch (err) {
        console.error('Error fetching employee details:', err);
        setError('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    }

    if (open && request) {
      fetchEmployeeDetails();
    } else {
      // Reset state when modal closes
      setEmployeeDetails(null);
      setLoading(true);
      setError(null);
    }
  }, [open, request]);

  const handleAction = (type: 'approve' | 'deny') => {
    setConfirmDialog({
      open: true,
      type,
    });
  };

  const handleConfirmAction = async () => {
    if (!user?.id || !request) return;

    setProcessing(true);
    try {
      if (confirmDialog.type === 'approve') {
        await approveRequest({
          requestId: request.id,
          adminId: user.id,
        });
        addToast('Request approved successfully', 'success');
      } else {
        await denyRequest({
          requestId: request.id,
          adminId: user.id,
        });
        addToast('Request denied successfully', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error processing request:', err);
      addToast('Failed to process request', 'error');
    } finally {
      setProcessing(false);
      setConfirmDialog({ open: false, type: 'approve' });
    }
  };

  if (!request) return null;

  const formatDate = (timestamp: { seconds: number }) => {
    return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-xl">Request Details</DialogTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </DialogHeader>

          {error ? (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-4">Loading details...</div>
          ) : (
            <div className="space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Employee Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {employeeDetails?.firstName} {employeeDetails?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {employeeDetails?.roleName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {employeeDetails?.locationName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {employeeDetails?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Request Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {requestTypeLabels[request.type as keyof typeof requestTypeLabels]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span
                      className={cn(
                        'mt-1 inline-flex px-2 py-1 rounded-md text-xs font-medium border',
                        statusStyles[request.status as keyof typeof statusStyles]
                      )}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(request.startDate)}
                    </p>
                  </div>
                  {request.endDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">End Date</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(request.endDate)}
                      </p>
                    </div>
                  )}
                  {request.hoursOff && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hours Requested</p>
                      <p className="mt-1 text-sm text-gray-900">{request.hoursOff}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {request.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                    {request.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {(request.status === 'pending' || request.status === 'approved') && (
                <DialogFooter className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleAction('deny')}
                    disabled={processing}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                  {request.status === 'pending' && (
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                </DialogFooter>
              )}
            </div>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'approve' })}
        onConfirm={handleConfirmAction}
        title={`${confirmDialog.type === 'approve' ? 'Approve' : 'Deny'} Request`}
        message={`Are you sure you want to ${confirmDialog.type} this request?`}
        confirmText={confirmDialog.type === 'approve' ? 'Approve' : 'Deny'}
        isDestructive={confirmDialog.type === 'deny'}
        loading={processing}
      />
    </>
  );
}