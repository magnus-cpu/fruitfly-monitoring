
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

const DetailPanel: React.FC<DetailPanelProps> = ({ feature, geoData, onClose, onNavigate }) => {
  if (!feature) return null;
  const sensorGatewayId = typeof feature.gateway_id === 'number' ? feature.gateway_id : null;
  const navigate = useNavigate();

  return (
    <div className="relative mt-4 h-auto w-full bg-white shadow-lg z-[1001] p-6 flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out lg:absolute lg:top-0 lg:right-0 lg:mt-0 lg:h-full lg:w-1/3">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
      >
        <X size={24} />
      </button>

      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 flex-1 overflow-y-auto pr-1">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{feature.name}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {feature.entity === 'gateway' ? 'Gateway Node' : 'Sensor Node'}
          </p>
        </div>

        {feature.entity === 'gateway' ? (
          // Gateway Details
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
              <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Location</p>
              <p className="text-lg font-bold text-slate-600">{feature.location}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
              <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Gateway ID</p>

              <div className='flex justify-between  py-1 px-4'>
                <p className="text-lg font-bold text-slate-600">{feature.id}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(feature.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md border border-slate-200 shadow-sm transition-all"
                >
                  <LucideEye size={14} />
                  <span className="text-xs font-medium whitespace-nowrap">View Data</span>
                </button>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-slate-500/50 p-4 rounded-2xl">
              <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Connected Sensors</p>
              <p className="text-2xl font-black text-blue-600">
                {geoData?.features.filter(
                  f => f.properties.entity === 'sensor' && f.properties.gateway_id === feature.id
                ).length ?? 0}
              </p>
            </div>
          </div>
        ) : (
          // Sensor Details
          <div className="space-y-4">
            {feature.activity_status && (
              <p className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${feature.activity_status === 'active'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
                }`}>
                {feature.activity_status}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                <Thermometer className="text-orange-400 mb-2" size={30} />
                <p className="text-xs font-semibold tracking-widest text-slate-800">Temperature</p>
                <p className="text-xl font-bold text-slate-600">{feature.temp ?? 'N/A'}°C</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                <Droplets className="text-blue-400 mb-2" size={30} />
                <p className="text-xs font-semibold tracking-widest text-slate-800">Humidity</p>
                <p className="text-xl font-bold text-slate-600">{feature.humidity ?? 'N/A'}%</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
              <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Location</p>
              <p className="text-lg font-bold text-slate-600">{feature.location}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
              <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Gateway ID</p>
              <div className='flex justify-between  py-1 px-4'>
                <p className="text-lg font-bold text-slate-600">{feature.gateway_id ?? 'N/A'}</p>
                {sensorGatewayId !== null ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(sensorGatewayId, feature.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md border border-slate-200 shadow-sm transition-all"
                  >
                    <LucideEye size={14} />
                    <span className="text-xs font-medium whitespace-nowrap">View Data</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-slate-500/50 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-rose-500">
                  <Bug size={20} />
                  <span className="font-bold">Insect Count</span>
                </div>
                <span className="text-xl font-black text-rose-500">{feature.insects ?? 0}</span>
              </div>
              <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 transition-all duration-1000"
                  style={{ width: `${Math.min((feature.insects ?? 0) * 2, 100)}%` }}
                />
              </div>
              <p className="text-[12px] text-slate-500 mt-2">Threshold: 50 per node</p>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => navigate('/reports')}
        className="mt-4 shrink-0 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
      >
        Download Sector Report
      </button>
    </div>
  );
};

export default DetailPanel;
