import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import api from '../api/Sapi';
import BackButton from '../components/BackButton';

interface FruitflyImageRow {
  id: number;
  sensor_name: string;
  sensor_serial_number: string;
  analysis_status: 'pending' | 'analyzed' | 'failed';
  image_url: string;
  time_captured: string | null;
  created_at: string;
}

interface SensorOption {
  id: number;
  name: string;
  serial_number: string;
}

const statusClassMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  analyzed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700'
};

const FruitflyImages: React.FC = () => {
  const [rows, setRows] = useState<FruitflyImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [selectedSensorSerial, setSelectedSensorSerial] = useState<string>('all');

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 80 };
      if (selectedSensorSerial !== 'all') {
        params.sensor_serial_number = selectedSensorSerial;
      }
      const { data } = await api.get('/device/fruitfly-images', {
        params
      });
      setRows(data.rows ?? []);
    } catch (error) {
      console.error('Failed to load fruitfly images', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const { data } = await api.get('/sensors');
        setSensors(data ?? []);
      } catch (error) {
        console.error('Failed to load sensors for image filter', error);
      }
    };

    fetchSensors();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [selectedSensorSerial]);

  const totals = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.analysis_status === 'pending').length,
      analyzed: rows.filter((row) => row.analysis_status === 'analyzed').length
    }),
    [rows]
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <BackButton className="mb-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Fruitfly Images</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedSensorSerial}
              onChange={(e) => setSelectedSensorSerial(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 max-w-[260px]"
            >
              <option value="all">All Sensors</option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.serial_number}>
                  {sensor.name} ({sensor.serial_number})
                </option>
              ))}
            </select>
            <button
              onClick={fetchImages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totals.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{totals.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Analyzed</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{totals.analyzed}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading images...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No images found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((row) => (
              <article key={row.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-video bg-slate-100">
                  <img
                    src={row.image_url}
                    alt={`Fruitfly capture ${row.id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate inline-flex items-center gap-1">
                      <Camera size={14} />
                      {row.sensor_name}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusClassMap[row.analysis_status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {row.analysis_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{row.sensor_serial_number}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(row.time_captured ?? row.created_at).toLocaleString()}
                  </p>
                  <a
                    href={row.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <ImageIcon size={14} />
                    Open Full Image
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FruitflyImages;
