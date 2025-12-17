import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import axios from 'axios';
import { Plus, MapPin, Thermometer, Droplets, Trash2, Edit } from 'lucide-react';

interface Gateway {
  id: number;
  name: string;
  description: string;
  location: string;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}

interface GatewayData {
  id: number;
  temperature: number;
  humidity: number;
  created_at: string;
}

const GateWays: React.FC = () => {
  const { user } = useAuth();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [gatewayData, setGatewayData] = useState<GatewayData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    location_lat: '',
    location_lng: '',
  });


  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/gateways');
      const parsed = response.data.map((s: Gateway) => ({
        ...s,
        location_lat: Number(s.location_lat),
        location_lng: Number(s.location_lng),
      }));
      setGateways(parsed);
    } catch (error) {
      console.error('Error fetching Getways:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGatewayData = async (gatewayId: number) => {
    try {
      setDataLoading(false);
      const response = await axios.get(`http://localhost:5000/api/gateways-data/${gatewayId}/data`);
      setGatewayData(response.data);
    } catch (error) {
      console.error('Error fetching Gateway data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch all Gateways once
  useEffect(() => {
    fetchGateways();
  }, []);

  // Auto-refresh selected Gateway’s data
  useEffect(() => {
    if (!selectedGateway) return; // No Gateway selected yet

    // Fetch immediately
    fetchGatewayData(selectedGateway.id);

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchGatewayData(selectedGateway.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGateway]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location_lat || !formData.location_lng) {
      alert('Please fill in all fields');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      location: formData.location,
      location_lat: parseFloat(formData.location_lat),
      location_lng: parseFloat(formData.location_lng),
    };

    try {
      if (editingGateway) {
        /* ---------- UPDATE ---------- */
        await axios.put(
          `http://localhost:5000/api/gateways/${editingGateway.id}`,
          payload
        );
        // Optimistic local update
        setGateways((prev) =>
          prev.map((s) =>
            s.id === editingGateway.id ? { ...s, ...payload } : s
          )
        );
        if (selectedGateway?.id === editingGateway.id) {
          setSelectedGateway({ ...selectedGateway, ...payload });
        }
      } else {
        /* ---------- CREATE ---------- */
        const { data } = await axios.post(
          'http://localhost:5000/api/gateways',
          payload
        );
        setGateways((prev) => [
          ...prev,
          { ...payload, id: data.id, status: 'active', created_at: new Date().toISOString() },
        ]);
      }

      // Reset form + close drawer
      setFormData({
        name: '',
        description: '',
        location: '',
        location_lat: '',
        location_lng: '',
      });
      setShowAddForm(false);
      setEditingGateway(null);
    } catch (err) {
      console.error(err);
      alert('Operation failed');
    }
  };
  const deleteGateway = async (gatewayId: number) => {
    if (!confirm('Are you sure you want to delete this gateway?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/gateways/${gatewayId}`);
      setGateways(gateways.filter(s => s.id !== gatewayId));
      if (selectedGateway?.id === gatewayId) {
        setSelectedGateway(null);
        setGatewayData([]);
      }
    } catch (error) {
      console.error('Error deleting Gateway:', error);
      alert('Failed to delete Gateway');
    }
  };


  const startEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      description: gateway.description,
      location: gateway.location,
      location_lat: String(gateway.location_lat),
      location_lng: String(gateway.location_lng),
    });
    setShowAddForm(true);          // we reuse the same UI
  };

  const selectGateway = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    fetchGatewayData(gateway.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold">Gateways</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Gateway
        </button>
      </div>

      {/* Add Gateway Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingGateway ? "Update Gateway" : "Add New Gateway"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Greenhouse Gateway 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Greenhouse Gateway 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location_lat}
                  onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 40.7128"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location_lng}
                  onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., -74.0060"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Any special notes"

                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className={`px-6 py-2 rounded-md text-white ${editingGateway
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                {editingGateway ? "Update Gateway" : "Create Gateway"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGateway(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gateways List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            {/* <h1 className="text-3xl font-bold">@{user?.username}</h1> */}
            <h2 className="text-xl font-semibold">@{user?.username} Gateways ({gateways.length})</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading gateways...</div>
          ) : gateways.length === 0 ? (
            <div className="p-6  text-center text-gray-500">
              No gateways added yet. Click "Add gateway" to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {gateways.map((gateway) => (
                <div
                  key={gateway.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedGateway?.id === gateway.id ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => selectGateway(gateway)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">{gateway.name}</h3>
                        <p className="text-sm text-gray-500">
                          {gateway.location_lat.toFixed(6)}, {gateway.location_lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${gateway.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {gateway.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(gateway);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGateway(gateway.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gateway Data */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {selectedGateway ? `${selectedGateway.name} Data` : 'Select a Gateway'}
            </h2>
          </div>
          {selectedGateway ? (
            <div className="p-6">
              {dataLoading ? (
                <div className="text-center">Loading gateway data...</div>
              ) : gatewayData.length === 0 ? (
                <div className="text-center text-gray-500">No data available for this Gateway</div>
              ) : (
                <div className="space-y-4">
                  {/* Latest Reading */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Latest Reading</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <Thermometer className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Temperature</p>
                          <p className="font-semibold">{gatewayData[0]?.temperature}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Droplets className="w-5 h-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Humidity</p>
                          <p className="font-semibold">{gatewayData[0]?.humidity}%</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(gatewayData[0]?.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Recent Readings */}
                  <div>
                    <h3 className="font-semibold mb-3">Recent Readings</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {gatewayData.slice(0, 10).map((data) => (
                        <div key={data.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex space-x-4 text-sm">
                            <span>{data.temperature}°C</span>
                            <span>{data.humidity}%</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(data.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Click on a Gateway to view its data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GateWays;