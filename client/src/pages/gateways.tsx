import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  MapPin,
  Trash2,
  Edit,
  Activity,
  Wifi,
  Cpu,
  ChevronRight,
  Info,
  X,
  PinIcon,
  LucideEye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/Sapi';
import { PageInfo, type ContentBlock } from '../components/PageInfo';

interface Gateway {
  id: number;
  name: string;
  serial_number: string;
  description: string;
  location: string;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}
interface Node {
  id: number;
  name: string;
  serial_number: string;
  description: string;
  location: string;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}

const GateWays = () => {
  // --- State Management ---
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState({
    gateways: false,
    nodes: false,
    submit: false
  });

  type FormType = 'gateway' | 'node';
  type FormMode = 'create' | 'edit';

  interface FormConfig {
    isOpen: boolean;
    type: FormType;
    mode: FormMode;
    data: Gateway | Node | null;
  }

  const [formConfig, setFormConfig] = useState<FormConfig>({
    isOpen: false,
    type: 'gateway',
    mode: 'create',
    data: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    location_lat: '',
    location_lng: '',
  });

  // --- Data Fetching ---
  const fetchGateways = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, gateways: true }));
      const { data } = await api.get('/gateways');
      setGateways(data.map((g: Gateway) => ({
        ...g,
        location_lat: Number(g.location_lat),
        location_lng: Number(g.location_lng)
      })));
    } catch (err) {
      console.error("Failed to fetch gateways", err);
    } finally {
      setLoading(prev => ({ ...prev, gateways: false }));
    }
  }, []);

  const fetchNodes = useCallback(async (gatewayId: number) => {
    try {
      setLoading(prev => ({ ...prev, nodes: true }));
      const { data } = await api.get(`/sensors/${gatewayId}/nodes`);
      setNodes(data);
    } catch (err) {
      console.error("Failed to fetch nodes", err);
      setNodes([]); // Reset nodes on error or if endpoint doesn't exist yet
    } finally {
      setLoading(prev => ({ ...prev, nodes: false }));
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  useEffect(() => {
    api.get('/content', { params: { page: 'gateways' } })
      .then((res) => setContentBlocks(res.data))
      .catch((err) => console.error('Failed to load gateways info', err));
  }, []);

  useEffect(() => {
    if (selectedGateway) {
      fetchNodes(selectedGateway.id);
    }
  }, [selectedGateway, fetchNodes]);

  // --- Handlers ---
  const handleOpenForm = (type: FormType, mode: FormMode, item?: Gateway | Node | null) => {
    setFormConfig({ isOpen: true, type, mode, data: item ?? null });
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        location: item.location || '',
        location_lat: String(item.location_lat || ''),
        location_lng: String(item.location_lng || ''),
      });
    } else {
      setFormData({ name: '', description: '', location: '', location_lat: '', location_lng: '' });
    }
  };

  const handleCloseForm = () => {
    setFormConfig({ ...formConfig, isOpen: false });
    setFormData({ name: '', description: '', location: '', location_lat: '', location_lng: '' });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));

    const payload = {
      ...formData,
      location_lat: parseFloat(formData.location_lat),
      location_lng: parseFloat(formData.location_lng),
    };

    try {
      let endpoint = '';

      if (formConfig.type === 'gateway') {
        endpoint = 'gateways';
      } else {
        endpoint = `sensors/${selectedGateway?.id}/nodes`;
      }

      if (formConfig.mode === 'edit' && formConfig.data) {
        const id = formConfig.data.id;

        let endpoint = '';

        if (formConfig.type === 'gateway') {
          endpoint = 'gateways';
        } else {
          endpoint = 'sensors';
        }

        await api.put(`/${endpoint}/${id}`, payload);
      } else {
        await api.post(`/${endpoint}`, payload);
      }

      // Refresh Data
      if (formConfig.type === 'gateway') fetchGateways();
      else if (selectedGateway) fetchNodes(selectedGateway.id);

      handleCloseForm();
    } catch (err) {
      console.error("Form submission failed", err);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      let endpoint = '';

      if (type === 'gateway') {
        endpoint = 'gateways';
      } else {
        endpoint = 'sensors';
      }
      await api.delete(`/${endpoint}/${id}`);
      if (type === 'gateway') {
        fetchGateways();
        if (selectedGateway?.id === id) setSelectedGateway(null);
      } else {
        if (selectedGateway) fetchNodes(selectedGateway.id);
      }
    } catch (err) {
      console.error(`Delete ${type} failed`, err);
    }
  };

  const handleNavigateData = async (id: number) => {
    navigate(`/gateways/${id}/sensors`);

  }

  // --- Components ---
  const StatusBadge: React.FC<{ status?: string }> = ({ status }) => (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}>
      {status || 'unknown'}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-widest">Devices Management</h1>
            <p className="text-slate-500  mt-1">Monitor and manage your IoT Gateways and Nodes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenForm('gateway', 'create')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              <Plus size={18} /> Add Gateway
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gateways Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Wifi size={18} className="text-indigo-500" /> Gateways
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                  {gateways.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {loading.gateways ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : gateways.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">No gateways configured</div>
                ) : (
                  gateways.map(gw => (

                    <div
                      key={gw.id}
                      onClick={() => setSelectedGateway(gw)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50 group rounded-lg 
                        ${selectedGateway?.id === gw.id ? 'bg-indigo-50/50 border-r-4 border-indigo-500' : 'border border-slate-200'}
                      `}
                    >
                      <div className="flex justify-between items-start gap-4">

                        {/* Left Section: Icon + Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-lg 
                              ${selectedGateway?.id === gw.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`
                            }>
                            <Activity size={20} />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">{gw.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin size={12} /> <span>{gw.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <PinIcon size={12} /> <span>{gw.serial_number}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section: Status + Actions */}
                        <div className="flex flex-col items-end gap-2">

                          {/* Status + View Data */}
                          <div className="flex items-center gap-2 bg-black/5 p-2 rounded-lg">
                            <StatusBadge status={gw.status} />

                            <button
                              onClick={(e) => { e.stopPropagation(); handleNavigateData(gw.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md border border-slate-200 shadow-sm transition-all"
                            >
                              <LucideEye size={14} />
                              <span className="text-xs font-medium whitespace-nowrap">View Data</span>
                            </button>
                          </div>

                          {/* Edit/Delete Buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenForm('gateway', 'edit', gw); }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 shadow-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete('gateway', gw.id); }}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>

                  ))
                )}
              </div>
            </div>
          </div>

          {/* Nodes Content Area */}
          <div className="lg:col-span-8">
            {selectedGateway ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Gateway Detail Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Wifi size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedGateway!.name}</h2>
                        <p className="text-slate-500 text-sm max-w-md">{selectedGateway!.description || 'No description provided.'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenForm('node', 'create')}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      <Plus size={16} /> Register Node
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Status</div>
                      <StatusBadge status={selectedGateway!.status} />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Coordinates</div>
                      <div className="text-sm font-mono text-slate-700">{selectedGateway!.location_lat.toFixed(4)}, {selectedGateway!.location_lng.toFixed(4)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Active Nodes</div>
                      <div className="text-sm font-bold text-slate-700">{nodes.length} Connected</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Location</div>
                      <div className="text-sm font-medium text-slate-700 truncate">{selectedGateway!.location}</div>
                    </div>
                  </div>
                </div>

                {/* Nodes List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Cpu size={18} className="text-emerald-500" /> Connected Nodes
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {loading.nodes ? (
                      <div className="p-12 text-center text-slate-400">Fetching nodes...</div>
                    ) : nodes.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-300 mb-3">
                          <Info size={32} />
                        </div>
                        <p className="text-slate-500">No nodes registered to this gateway yet.</p>
                      </div>
                    ) : (

                      nodes.map(node => (
                        <div key={node.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                              <Cpu size={20} />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{node.name}</h4>

                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <p className="text-xs text-slate-500">{node.location} • {node.description || 'No description'} </p>
                                <PinIcon size={12} /> {node.serial_number}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <StatusBadge status={node.status} />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenForm('node', 'edit', node)}
                                className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete('node', node.id)}
                                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <Wifi size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Gateway Selected</h3>
                <p className="text-slate-500 mt-2 max-w-xs">
                  Select a gateway from the list on the left to view its connected nodes and detailed performance data.
                </p>
                <div className="mt-8 flex gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                    <ChevronRight size={14} /> Select from sidebar
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <PageInfo title="Deployment & Maintenance" blocks={contentBlocks} />
        </div>
      </div>

      {/* Unified Form Modal */}
      {formConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 capitalize">
                {formConfig.mode} {formConfig.type}
                {formConfig.type === 'node' && ` (for ${selectedGateway?.name})`}
              </h2>
              <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder={`Enter ${formConfig.type} name`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location Name</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Physical location (e.g. Zone A)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.location_lat}
                    onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.location_lng}
                    onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows-3
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                    placeholder="Optional details..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.submit}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {loading.submit ? 'Saving...' : formConfig.mode === 'edit' ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateWays;
