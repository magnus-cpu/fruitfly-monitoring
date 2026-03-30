
import React from 'react';
import { X, Thermometer, Droplets, Bug, LucideEye } from 'lucide-react';
import type { SensorProperties, GeoFeature } from '../pages/Dashboard';
import { useNavigate } from 'react-router-dom';

interface DetailPanelProps {
  feature: SensorProperties;
  geoData: { features: GeoFeature[] } | null;
  onClose: () => void;
  onNavigate: (gatewayId: number, sensorId?: number) => void;
}

const getStatusClassName = (status?: string) => {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
  }

  if (status === 'inactive') {
    return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
  }

  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
};

const infoCardClassName = 'rounded-[22px] border border-slate-200 bg-slate-50 p-4';
const actionButtonClassName = 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600';

const DetailPanel: React.FC<DetailPanelProps> = ({ feature, geoData, onClose, onNavigate }) => {
  if (!feature) return null;
  const sensorGatewayId = typeof feature.gateway_id === 'number' ? feature.gateway_id : null;
  const navigate = useNavigate();
  const connectedSensors = geoData?.features.filter(
    (entry) => entry.properties.entity === 'sensor' && entry.properties.gateway_id === feature.id
  ).length ?? 0;

  return (
    <div className="relative z-[1001] mt-4 flex h-auto w-full flex-col overflow-hidden border-t border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-full lg:w-[360px] lg:border-l lg:border-t-0 lg:bg-white/[0.96] lg:backdrop-blur-xl">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-800"
      >
        <X size={18} />
      </button>

      <div className="flex-1 space-y-4 overflow-y-auto p-5 pr-3">
        <div className="rounded-[26px] border border-emerald-950/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,#10231c_0%,#173227_55%,#0f1e18_100%)] p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
            {feature.entity === 'gateway' ? 'Gateway Node' : 'Sensor Node'}
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">{feature.name}</h3>
          <p className="mt-1.5 text-xs leading-5 text-emerald-50/80">{feature.location}</p>
          {feature.entity === 'sensor' && feature.activity_status ? (
            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClassName(feature.activity_status)}`}>
              {feature.activity_status}
            </span>
          ) : null}
        </div>

        {feature.entity === 'gateway' ? (
          <div className="space-y-4">
            <div className={infoCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Gateway Serial</p>
              <p className="mt-2.5 text-base font-semibold text-slate-900">{feature.serial_number ?? 'N/A'}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(feature.id); }}
                className={`${actionButtonClassName} mt-5`}
              >
                <LucideEye size={16} />
                View gateway data
              </button>
            </div>

            <div className={infoCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location</p>
              <p className="mt-2.5 text-sm font-medium text-slate-900">{feature.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={infoCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Connected Sensors</p>
                <p className="mt-2.5 text-2xl font-semibold text-slate-900">{connectedSensors}</p>
                <p className="mt-1.5 text-xs text-slate-500">Assigned here.</p>
              </div>
              <div className="rounded-[22px] border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Next step</p>
                <p className="mt-2.5 text-sm font-semibold text-indigo-950">Open its data screen.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={infoCardClassName}>
                <Thermometer className="mb-3 text-orange-500" size={26} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Temperature</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900">{feature.temp ?? 'N/A'}°C</p>
              </div>
              <div className={infoCardClassName}>
                <Droplets className="mb-3 text-sky-500" size={26} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Humidity</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900">{feature.humidity ?? 'N/A'}%</p>
              </div>
            </div>

            <div className={infoCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Gateway Serial</p>
              <p className="mt-2.5 text-base font-semibold text-slate-900">{feature.gateway_serial_number ?? 'N/A'}</p>
              {sensorGatewayId !== null ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(sensorGatewayId, feature.id); }}
                  className={`${actionButtonClassName} mt-5`}
                >
                  <LucideEye size={16} />
                  View sensor data
                </button>
              ) : null}
            </div>

            <div className={infoCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location</p>
              <p className="mt-2.5 text-sm font-medium text-slate-900">{feature.location}</p>
            </div>

            <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600">
                  <Bug size={18} />
                  <span className="text-sm font-semibold">Fruitfly count</span>
                </div>
                <span className="text-xl font-semibold text-rose-700">{feature.insects ?? 0}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000"
                  style={{ width: `${Math.min((feature.insects ?? 0) * 2, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-rose-700/80">Guide: 50 per node.</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <button
          onClick={() => navigate('/reports')}
          className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          Open reports
        </button>
      </div>
    </div>
  );
};

export default DetailPanel;
