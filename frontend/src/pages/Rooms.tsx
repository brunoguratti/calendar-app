import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Home, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import RoomModal from '../components/RoomModal';

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  active: boolean;
  createdAt: string;
  services: Array<{
    service: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    appointments: number;
  };
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we always set an array
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room? This may affect service assignments.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/rooms/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (error) {
      console.error('Error toggling room status:', error);
      alert('Failed to update room status');
    }
  };

  const handleModalClose = (refresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    if (refresh) {
      fetchRooms();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Home className="text-primary" />
            Rooms
          </h1>
          <p className="text-gray-600 mt-1">Manage your service spaces and room assignments</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700">Total Rooms</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{rooms.length}</p>
            </div>
            <Home className="text-primary-500" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-6 border border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-success-700">Active Rooms</p>
              <p className="text-3xl font-bold text-success-900 mt-2">
                {rooms.filter(r => r.active).length}
              </p>
            </div>
            <CheckCircle className="text-success-500" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 border border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-accent-700">Total Capacity</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {rooms.reduce((sum, room) => sum + room.capacity, 0)}
              </p>
            </div>
            <div className="text-accent-500 text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Home className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms yet</h3>
          <p className="text-gray-600 mb-6">Set up your first service space to get started</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus size={20} className="mr-2" />
            Add Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-6 relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{room.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        Capacity: {room.capacity}
                      </span>
                    </div>
                  </div>
                  {!room.active && (
                    <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {room.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Assigned Services */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Assigned Services ({room.services.length})
                  </h4>
                  {room.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {room.services.slice(0, 3).map((serviceRoom) => (
                        <span
                          key={serviceRoom.service.id}
                          className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {serviceRoom.service.name}
                        </span>
                      ))}
                      {room.services.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                          +{room.services.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No services assigned</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-primary-600">
                      {room._count.appointments}
                    </p>
                    <p className="text-xs text-gray-600">Bookings</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(room)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(room.id)}
                    className={`flex-1 text-sm py-2 px-4 rounded-lg font-semibold transition-all ${
                      room.active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-success-100 text-success-700 hover:bg-success-200'
                    }`}
                  >
                    {room.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="btn bg-danger-100 text-danger-700 hover:bg-danger-200 text-sm py-2 px-4"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <RoomModal
          room={selectedRoom}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
