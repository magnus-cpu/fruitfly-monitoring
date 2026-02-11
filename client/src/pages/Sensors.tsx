import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin,
  Thermometer,
  Droplets,
  Clock,
  Activity,
  ChevronLeft,
  RefreshCw,
  Wind,
  ShieldCheck,
  AlertTriangle,
  ActivityIcon,
  ChevronRight,
  Database,
  Search,
  Bug,
  Calendar
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/Sapi';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { Environmental, Fruitfly, Gateway, Sensor } from '../types/sensorTypes';
import { EnvTable } from '../components/EnvTable';
import { FruitflyTable } from '../components/FruitflyTable';
import { PageInfo, type ContentBlock } from '../components/PageInfo';


// --- Interfaces ---
interface SensorTelemetryResponse {
  status: boolean;
  sensor_id: number;
  environmental: Environmental[];
  fruitfly: Fruitfly[];
}

interface GatewayResponse {
  gateway: Gateway;
  sensors: Sensor[];
}

const Sensors: React.FC = () => {
  // --- State ---
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [envData, setEnvData] = useState<Environmental[]>([]);
  const [fruitflyData, setFruitflyData] = useState<Fruitfly[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const gatewayId = Number(id);

  const [loading, setLoading] = useState({
    gateways: false,
    sensors: false,
    data: false,
    refreshing: false
  });

  const onBack = () => {
    navigate(-1);
  };

  // --- Data Transformation for Charts (Daily view) ---
  const fruitflyChart = useMemo(
    () =>
      [...fruitflyData].reverse().map(f => ({
        fruitfly_count: f.fruitfly_count,
        displayTime: new Date(f.time_taken).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullDate: new Date(f.time_taken).toLocaleString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
      })),
    [fruitflyData]
  );

  const envChart = useMemo(
    () =>
      [...envData].reverse().map(e => ({
        temperature: e.temperature,
        humidity: e.humidity,
        displayTime: new Date(e.time_taken).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullDate: new Date(e.time_taken).toLocaleString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
      })),
    [envData]
  );

  // --- Fetching Logic ---
  const fetchSensors = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, sensors: true }));
      const endpoint = gatewayId ? `/gateways/${gatewayId}/data` : `/sensors`;
      const { data } = await api.get<GatewayResponse>(endpoint);

      setSensors(
        data.sensors.map((s: Sensor) => ({
          ...s,
          location_lat: Number(s.location_lat),
          location_lng: Number(s.location_lng),
        }))
      );

      setGateway({
        ...data.gateway,
        location_lat: Number(data.gateway.location_lat),
        location_lng: Number(data.gateway.location_lng),
      });
    } catch (error) {
      console.error('Error fetching sensors:', error);
    } finally {
      setLoading(prev => ({ ...prev, sensors: false }));
    }
  }, [gatewayId]);

  const fetchSensorData = useCallback(async (sensorId: string, isSilent = false) => {
    if (!isSilent) setLoading(prev => ({ ...prev, data: true }));
    else setLoading(prev => ({ ...prev, refreshing: true }));

    try {
      const { data } = await api.get<SensorTelemetryResponse>(
        `/fruitfly/${sensorId}/combined_data`
      );

      setEnvData(data.environmental);
      setFruitflyData(data.fruitfly);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    } finally {
      setLoading(prev => ({ ...prev, data: false, refreshing: false }));
    }
  }, []);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    api.get('/content', { params: { page: 'sensors' } })
      .then((res) => setContentBlocks(res.data))
      .catch((err) => console.error('Failed to load sensors info', err));
  }, []);

  useEffect(() => {
    if (!selectedSensor) return;
    fetchSensorData(selectedSensor.serial_number);
    const interval = setInterval(() => {
      fetchSensorData(selectedSensor.serial_number, true);
    }, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [selectedSensor, fetchSensorData]);

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const latestEnv = useMemo(() => {
    if (!envData.length) return null;
    return [...envData].sort(
      (a, b) =>
        new Date(b.time_taken).getTime() -
        new Date(a.time_taken).getTime()
    )[0];
  }, [envData]);

  const latestFruitfly = useMemo(() => {
    if (!fruitflyData.length) return null;
    return [...fruitflyData].sort(
      (a, b) =>
        new Date(b.time_taken).getTime() -
        new Date(a.time_taken).getTime()
    )[0];
  }, [fruitflyData]);

  const latestUpdatedAt = useMemo(() => {
    const envTime =
      envData.length > 0
        ? new Date(
          Math.max(...envData.map(e => new Date(e.time_taken).getTime()))
        )
        : null;

    const fruitflyTime =
      fruitflyData.length > 0
        ? new Date(
          Math.max(...fruitflyData.map(f => new Date(f.time_taken).getTime()))
        )
        : null;

    if (envTime && fruitflyTime) {
      return envTime > fruitflyTime ? envTime : fruitflyTime;
    }

    return envTime || fruitflyTime || null;
  }, [envData, fruitflyData]);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
            {payload[0].payload.fullDate}
          </p>
          <p className="text-lg font-black text-slate-900">
            {payload[0].value}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-100 min-w-screen">
      {/* --- SIDEBAR --- */}
      <nav
        className={`fixed left-0  h-full  bg-white/80 border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out z-50 flex flex-col
           ${isOpen ? 'w-80' : 'w-16'}`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-17 bg-indigo-600 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Sidebar Header */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-3 h-20">
          <div className="shrink-0 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-100 shadow-lg">
            <Activity size={22} />
          </div>
          {isOpen && (

            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-800 whitespace-nowrap">Nodes List</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {sensors.length} Connected
              </p>
            </div>
          )}
        </div>

        {/* Search Bar Placeholder (Optional UI Polish) */}
        {isOpen && (
          <div className="px-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search nodes..."
                className="w-full bg-slate-50 border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading.sensors ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading sensors...</div>
          ) : sensors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">No nodes found.</div>
          ) : (
            <div className="px-2 space-y-1 py-2">
              {sensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all relative group
                    ${selectedSensor?.id === sensor.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className={`shrink-0 py-2 px-1 rounded-lg transition-colors
                    ${selectedSensor?.id === sensor.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <Wind size={18} />
                  </div>

                  {isOpen && (
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-sm truncate">{sensor.name}</span>
                        <div className={`w-2 h-2 rounded-full ${sensor.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin size={10} /> {sensor.location}
                      </div>
                    </div>
                  )}

                  {!isOpen && selectedSensor?.id === sensor.id && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${isOpen ? 'ml-80' : 'ml-20'}`}
      >
        <div className="p-6 md:p-10 max-w-6xl mx-auto">

          {/* Top Header / Breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-5">
              <button
                onClick={onBack}
                className="group p-2.5 bg-white hover:bg-indigo-600 rounded-xl border border-slate-200 transition-all shadow-sm"
              >
                <ChevronLeft size={20} className="text-slate-600 group-hover:text-white" />
              </button>

              <div>
                {!gateway ? (
                  <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg" />
                ) : (
                  <>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {gateway.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <ActivityIcon size={12} /> ID: {gateway.serial_number}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusColor(gateway.status)}`}>
                        {gateway.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

          <div className="flex items-center gap-3">
              {loading.refreshing && (
                <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-100">
                  <RefreshCw size={14} className="text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-indigo-700">Live Updating...</span>
                </div>
              )}
              <button
                onClick={fetchSensors}
                disabled={loading.sensors}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading.sensors ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {selectedSensor ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Sensor Identification Header */}
              <div className="bg-indigo-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Activity size={70} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Live Node Monitoring</span>
                  </div>
                  <h2 className="text-3xl font-black">{selectedSensor.name}</h2>
                  <p className="text-indigo-200 mt-2 max-w-xl text-sm leading-relaxed">{selectedSensor.description || 'Continuous environmental monitoring active for this node.'}</p>
                </div>
              </div>

              {/* Big Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <Bug size={32} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">Real-time</span>
                  </div>
                  <p className="text-slate-500 text-sm font-bold">Insects</p>
                  <h4 className="text-3xl font-black text-slate-900 mt-1 flex items-baseline">
                    {latestFruitfly?.fruitfly_count ?? '--'}<span className="text-slate-300 text-base ml-1">counts</span>
                  </h4>
                </div>

                <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <Thermometer size={32} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">Real-time</span>
                  </div>
                  <p className="text-slate-500 text-sm font-bold">Temperature</p>
                  <h4 className="text-3xl font-black text-slate-900 mt-1 flex items-baseline">
                    {latestEnv?.temperature ?? '--'}<span className="text-slate-300 text-base ml-1">°C</span>
                  </h4>
                </div>

                <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <Droplets size={32} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">Real-time</span>
                  </div>
                  <p className="text-slate-500 text-sm font-bold">Humidity</p>
                  <h4 className="text-3xl font-black text-slate-900 mt-1 flex items-baseline">
                    {latestEnv?.humidity ?? '--'}<span className="text-slate-300 text-base ml-1">%</span>
                  </h4>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Database size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Historical Telemetry</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Clock size={12} />
                        Updated:{' '}
                        {latestUpdatedAt
                          ? latestUpdatedAt.toLocaleString()
                          : 'Waiting for data...'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Secured
                    </span>
                  </div>
                </div>

                {loading.data ? (
                  <div className="p-24 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <RefreshCw className="animate-spin text-indigo-600" size={48} />
                      <Activity className="absolute inset-0 m-auto text-indigo-200" size={20} />
                    </div>
                    <p className="text-slate-500 font-bold animate-pulse">Synchronizing Data Streams...</p>
                  </div>
                ) : envData.length === 0 ? (
                  <div className="p-24 text-center">
                    <div className="inline-flex p-6 rounded-3xl bg-slate-50 text-slate-200 mb-4">
                      <AlertTriangle size={48} />
                    </div>
                    <h4 className="text-slate-900 font-bold text-lg">Empty Dataset</h4>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">No historical logs have been recorded for this node yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      <EnvTable envData={envData} />
                      <FruitflyTable fruitflyData={fruitflyData} />
                    </div>

                    {/* --- GRAPHICAL ANALYTICS SECTION (Daily) --- */}
                    <div className="grid grid-cols-1 p-4 lg:grid-cols-3 gap-3">

                      {/* Insect count Chart */}
                      <div className="bg-white p-4 border-t mt-1 border-slate-300">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">FruitFly History</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Last 12 Days (Counts)</p>
                            </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fruitflyChart}>
                              <defs>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="displayTime"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Tooltip content={<CustomTooltip unit=" Counts" />} />
                              <Area
                                type="monotone"
                                dataKey="fruitfly_count"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                                animationDuration={1500}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Temp Chart */}
                      <div className="bg-white p-4 border-t mt-1 border-slate-300">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">Temperature History</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Last 12 Days (°C)</p>
                            </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={envChart}>
                              <defs>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="displayTime"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Tooltip content={<CustomTooltip unit="°C" />} />
                              <Area
                                type="monotone"
                                dataKey="temperature"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                                animationDuration={1500}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Humidity Chart */}
                      <div className="bg-white p-4 border-t mt-1 border-slate-300">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">Humidity History</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Last 12 Days (%)</p>
                            </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={envChart}>
                              <defs>
                                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="displayTime"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Tooltip content={<CustomTooltip unit="%" />} />
                              <Area
                                type="monotone"
                                dataKey="humidity"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorHum)"
                                animationDuration={1500}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-5 text-center animate-in fade-in duration-700">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <Activity size={64} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600">
                  <Wind size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 w-60">Select a Telemetry Node</h3>
              <p className="text-slate-500 mt-3 max-w-sm leading-relaxed">
                Choose a specific sensor node from the sidebar to visualize environmental trends and access encrypted telemetry logs.
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Open Nodes List
              </button>
            </div>
          )}

          <div className="mt-10">
            <PageInfo title="Operations & Control" blocks={contentBlocks} />
          </div>
        </div>
      </main>

      {/* --- Styles for Custom Scrollbar --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default Sensors;
