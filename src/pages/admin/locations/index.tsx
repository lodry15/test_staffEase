import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { getLocations, createLocation, updateLocation, deleteLocation } from '@/lib/db/locations';
import { useAuthStore } from '@/store/auth';
import { Location } from '@/types';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';

export function LocationsPage() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const fetchedLocations = await getLocations();
      setLocations(fetchedLocations);
      setError(null);
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setLocationName('');
    setError(null);
    setIsAddModalOpen(true);
  }

  async function handleAddLocation() {
    if (!user?.id) return;
    
    try {
      setError(null);
      await createLocation(locationName.trim(), user.id);
      await loadLocations();
      setIsAddModalOpen(false);
      setLocationName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
    }
  }

  async function handleEditLocation() {
    if (!selectedLocation) return;
    
    try {
      setError(null);
      await updateLocation(selectedLocation.id, locationName.trim());
      await loadLocations();
      setIsEditModalOpen(false);
      setSelectedLocation(null);
      setLocationName('');
    } catch (err: any) {
      setError(err.message || 'Failed to update location');
    }
  }

  async function handleDeleteLocation() {
    if (!selectedLocation) return;
    
    try {
      setError(null);
      await deleteLocation(selectedLocation.id);
      await loadLocations();
      setIsDeleteModalOpen(false);
      setSelectedLocation(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete location');
    }
  }

  function openEditModal(location: Location) {
    setSelectedLocation(location);
    setLocationName(location.name);
    setError(null);
    setIsEditModalOpen(true);
  }

  function openDeleteModal(location: Location) {
    setSelectedLocation(location);
    setError(null);
    setIsDeleteModalOpen(true);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading locations...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage locations for your organization
            </p>
          </div>
          
          <Button
            onClick={openAddModal}
            className="flex items-center transition-transform duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Location
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>
                    {format(location.createdAt.toDate(), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(location)}
                      className="hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(location)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {locations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                    No locations found. Click "Add New Location" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Location Modal */}
        <Dialog 
          open={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setLocationName('');
            setError(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Enter a name for the new location
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Location name"
              className="transition-shadow duration-200 focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setLocationName('');
                setError(null);
              }}
              className="transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddLocation}
              disabled={!locationName.trim()}
              className="transition-transform duration-200 hover:scale-105"
            >
              Add Location
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Edit Location Modal */}
        <Dialog 
          open={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
            setLocationName('');
            setError(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location name
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Location name"
              className="transition-shadow duration-200 focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedLocation(null);
                setLocationName('');
                setError(null);
              }}
              className="transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditLocation}
              disabled={!locationName.trim()}
              className="transition-transform duration-200 hover:scale-105"
            >
              Update Location
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Delete Location Modal */}
        <Dialog 
          open={isDeleteModalOpen} 
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedLocation(null);
            setError(null);
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-center">Delete Location</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this location? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedLocation(null);
                setError(null);
              }}
              className="min-w-[100px] transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLocation}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105"
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </AdminLayout>
  );
}