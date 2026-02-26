import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Cpu, Signal, Zap } from 'lucide-react';
import api from '../api/Sapi';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import BackButton from '../components/BackButton';

interface TelemetryRow {
  id: number;
  gateway_name: string | null;
  gateway_serial_number: string | null;
  sensor_name: string | null;
  sensor_serial_number: string | null;
  voltage: number | null;
  current: number | null;
  power: number | null;
  signal_strength: number | null;
  cpu_temp: number | null;
  time_taken: string | null;
  created_at: string;
}

interface SensorOption {
  id: number;
  name: string;
  serial_number: string;
}

interface GatewayOption {
  id: number;
  name: string;
  serial_number: string;
}

const DISPLAY_TZ_OFFSET_HOURS = 3;

const parseDbTimestamp = (value: string | null) => {
  if (!value) return { date: '-', time: '-', full: '-' };
  const normalized = value.replace('T', ' ').replace('Z', '').split('.')[0];
  const [datePart = '', timePart = '00:00:00'] = normalized.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0] = timePart.split(':').map(Number);

  if (!year || !month || !day) return { date: '-', time: '-', full: '-' };

  const utcMs = Date.UTC(year, month - 1, day, hour, minute);
  const shifted = new Date(utcMs + DISPLAY_TZ_OFFSET_HOURS * 60 * 60 * 1000);

  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
    full: `${yyyy}-${mm}-${dd} ${hh}:${min}`
  };
};

const formatValue = (value: number | null, suffix: string) =>
  value === null || value === undefined ? 'N/A' : `${value}${suffix}`;

const SystemTelemetry: React.FC = () => {
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [reporterType, setReporterType] = useState<'all' | 'sensor' | 'gateway'>('all');
  const [selectedSerial, setSelectedSerial] = useState<string>('all');
  const [rowLimit, setRowLimit] = useState<5 | 10 | 20>(10);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: rowLimit };

      if (reporterType === 'sensor' && selectedSerial !== 'all') {
        params.sensor_serial_number = selectedSerial;
      } else if (reporterType === 'gateway' && selectedSerial !== 'all') {
        params.gateway_serial_number = selectedSerial;
      }

      const { data } = await api.get('/device/system-telemetry', {
        params
      });
      setRows(data.rows ?? []);
    } catch (error) {
      console.error('Failed to load system telemetry', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const [sensorRes, gatewayRes] = await Promise.all([
          api.get('/sensors'),
          api.get('/gateways')
        ]);
        setSensors(sensorRes.data ?? []);
        setGateways(gatewayRes.data ?? []);
      } catch (error) {
        console.error('Failed to load device options', error);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [reporterType, selectedSerial, rowLimit]);

  const currentOptions = reporterType === 'sensor' ? sensors : reporterType === 'gateway' ? gateways : [];

  const latest = rows[0];
  const totals = useMemo(
    () => ({
      entries: rows.length,
      withSignal: rows.filter((r) => r.signal_strength !== null).length,
      avgVoltage:
        rows.filter((r) => r.voltage !== null).reduce((acc, curr) => acc + Number(curr.voltage), 0) /
        Math.max(rows.filter((r) => r.voltage !== null).length, 1),
      avgCurrent:
        rows.filter((r) => r.current !== null).reduce((acc, curr) => acc + Number(curr.current), 0) /
        Math.max(rows.filter((r) => r.current !== null).length, 1),
      avgPower:
        rows.filter((r) => r.power !== null).reduce((acc, curr) => acc + Number(curr.power), 0) /
        Math.max(rows.filter((r) => r.power !== null).length, 1),
      avgCpu:
        rows.filter((r) => r.cpu_temp !== null).reduce((acc, curr) => acc + Number(curr.cpu_temp), 0) /
        Math.max(rows.filter((r) => r.cpu_temp !== null).length, 1)
    }),
    [rows]
  );

  const chartData = useMemo(
    () =>
      [...rows]
        .reverse()
        .map((row) => ({
          timeLabel: parseDbTimestamp(row.time_taken ?? row.created_at).time,
          fullDate: parseDbTimestamp(row.time_taken ?? row.created_at).full,
          voltage: row.voltage,
          current: row.current,
          power: row.power,
          cpu_temp: row.cpu_temp
        })),
    [rows]
  );

  const ChartTooltip = ({ active, payload, unit }: { active?: boolean; payload?: Array<{ value: number; payload: { fullDate: string } }>; unit: string }) => {
    if (!active || !payload || payload.length === 0) return null;

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
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <BackButton className="mb-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">System Telemetry</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={reporterType}
              onChange={(e) => {
                const nextType = e.target.value as 'all' | 'sensor' | 'gateway';
                setReporterType(nextType);
                setSelectedSerial('all');
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
            >
              <option value="all">All Devices</option>
              <option value="sensor">Sensors Only</option>
              <option value="gateway">Gateways Only</option>
            </select>
            {reporterType !== 'all' && (
              <select
                value={selectedSerial}
                onChange={(e) => setSelectedSerial(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 max-w-[250px]"
              >
                <option value="all">All {reporterType === 'sensor' ? 'Sensors' : 'Gateways'}</option>
                {currentOptions.map((device) => (
                  <option key={device.id} value={device.serial_number}>
                    {device.name} ({device.serial_number})
                  </option>
                ))}
              </select>
            )}
            <select
              value={rowLimit}
              onChange={(e) => setRowLimit(Number(e.target.value) as 5 | 10 | 20)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
            >
              <option value={5}>Latest 5</option>
              <option value={10}>Latest 10</option>
              <option value={20}>Latest 20</option>
            </select>
            <button
              onClick={fetchTelemetry}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totals.entries}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Signal Rows</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totals.withSignal}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Avg Voltage</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{Number.isFinite(totals.avgVoltage) ? totals.avgVoltage.toFixed(2) : '0.00'}V</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Avg Current</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{Number.isFinite(totals.avgCurrent) ? totals.avgCurrent.toFixed(2) : '0.00'}A</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Avg Power</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{Number.isFinite(totals.avgPower) ? totals.avgPower.toFixed(2) : '0.00'}W</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Avg CPU Temp</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{Number.isFinite(totals.avgCpu) ? totals.avgCpu.toFixed(2) : '0.00'}°C</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 col-span-2 lg:col-span-6">
            <p className="text-xs text-slate-500">Latest Reporter</p>
            <p className="text-sm font-bold text-slate-900 mt-2 truncate">
              {latest?.sensor_name ?? latest?.gateway_name ?? 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900 mb-3">Voltage Trend (V)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip unit="V" />} />
                  <Area type="monotone" dataKey="voltage" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVoltage)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900 mb-3">Current Trend (A)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip unit="A" />} />
                  <Area type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900 mb-3">Power Trend (W)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip unit="W" />} />
                  <Area type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPower)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900 mb-3">CPU Temp Trend (°C)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip unit="°C" />} />
                  <Area type="monotone" dataKey="cpu_temp" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading telemetry...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No telemetry rows found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-700">
                      <Activity size={12} />
                      {row.sensor_name ?? row.gateway_name ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {parseDbTimestamp(row.time_taken ?? row.created_at).full}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Voltage</p>
                      <p className="font-bold text-slate-900">{formatValue(row.voltage, 'V')}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Current</p>
                      <p className="font-bold text-slate-900">{formatValue(row.current, 'A')}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Power</p>
                      <p className="font-bold text-slate-900 inline-flex items-center gap-1"><Zap size={13} />{formatValue(row.power, 'W')}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Signal / CPU</p>
                      <p className="font-bold text-slate-900 inline-flex items-center gap-1"><Signal size={13} />{formatValue(row.signal_strength, '')}</p>
                      <p className="font-bold text-slate-900 inline-flex items-center gap-1"><Cpu size={13} />{formatValue(row.cpu_temp, '°C')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemTelemetry;
