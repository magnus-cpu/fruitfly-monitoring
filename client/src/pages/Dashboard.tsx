
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/Sapi';
import {
  Thermometer, Bug, MapPin, Activity, Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DetailPanel from '../components/DetailPanel';
import { PageInfo, type ContentBlock } from '../components/PageInfo';
import BackButton from '../components/BackButton';

export interface SensorProperties {
  id: number;
  name: string;
  location: string;
  entity: 'sensor' | 'gateway';
  gateway_id?: number;
  temp?: number;
  humidity?: number;
  insects?: number;
  activity_status?: 'active' | 'inactive' | string;
}

export interface GeoFeature {
  type: 'Feature';
  properties: SensorProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

interface TelemetryPreview {
  sensor_name: string | null;
  gateway_name: string | null;
  power: number | null;
  signal_strength: number | null;
  created_at: string;
}

interface ImagePreview {
  sensor_name: string;
  analysis_status: string;
  image_url: string;
  created_at: string;
}


// --- Icons ---
const sensorIcon = new L.Icon({
  iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const gatewayIcon = new L.Icon({
  iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});


const pointToLayer = (feature: GeoFeature, latlng: L.LatLng) => {
  return L.marker(latlng, {
    icon: feature.properties.entity === 'gateway' ? gatewayIcon : sensorIcon
  });
};

// Component to zoom to clicked marker
const ZoomToMarker: React.FC<{ point: [number, number] | null }> = ({ point }) => {
  const map = useMap();

  useEffect(() => {
    if (!point) return;

    const currentZoom = map.getZoom();
    if (currentZoom < 15) {
      map.flyTo(point, 16, {
        animate: true,
        duration: 1.0
      });
    } else {
      map.flyTo(point, currentZoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [point, map]);

  return null;
};


const Dashboard: React.FC = () => {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SensorProperties | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [telemetryPreview, setTelemetryPreview] = useState<TelemetryPreview | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const navigate = useNavigate();

  // Fetch GeoJSON locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await api.get('/locations');
        setGeoData(res.data);
      } catch (err) {
        console.error('Failed to load locations', err);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    api.get('/content', { params: { page: 'dashboard' } })
      .then((res) => setContentBlocks(res.data))
      .catch((err) => console.error('Failed to load dashboard info', err));
  }, []);

  useEffect(() => {
    api.get('/device/system-telemetry', { params: { limit: 1 } })
      .then((res) => setTelemetryPreview(res.data?.rows?.[0] ?? null))
      .catch((err) => console.error('Failed to load telemetry preview', err));

    api.get('/device/fruitfly-images', { params: { limit: 1 } })
      .then((res) => setImagePreview(res.data?.rows?.[0] ?? null))
      .catch((err) => console.error('Failed to load image preview', err));
  }, []);

  const onEachFeature = useCallback((feature: GeoFeature, layer: L.Layer) => {
    const { properties } = feature;

    layer.on({
      click: () => {
        setSelectedFeature(feature.properties);
        setSelectedPoint([
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0]
        ]);
        layer.openPopup();
      }
    });

    if (properties.entity === 'gateway') {
      const connectedSensors = geoData?.features.filter(
        f => f.properties.entity === 'sensor' && f.properties.gateway_id === properties.id
      ).length ?? 0;

      layer.bindPopup(`
      <div class="p-2 min-w-[160px]">
        <b class="text-slate-800">${properties.name}</b>
        <p class="text-xs text-slate-500 mt-1">
          Gateway node<br/>
          Location: ${properties.location}<br/>
          Connected sensors: ${connectedSensors}
        </p>
      </div>
    `);
    } else {
      layer.bindPopup(`
      <div class="p-2 min-w-[160px]">
        <b class="text-slate-800">${properties.name}</b>
        <div class="text-xs text-slate-600 mt-2">
          📍 ${properties.location}<br/>
          🔗 Gateway ID: ${properties.gateway_id ?? 'N/A'}
        </div>
      </div>
    `);
    }
  }, [geoData]);


  // Sensor stats
  const sensorStats = useMemo(() => {
    if (!geoData) return { total: 0, active: 0, pests: 0, gateways: 0 };

    const sensors = geoData.features.filter(f => f.properties.entity === 'sensor');
    const gateways = geoData.features.filter(f => f.properties.entity === 'gateway');

    return {
      total: sensors.length,
      active: sensors.filter(s => s.properties.activity_status === 'active').length,
      pests: sensors.reduce((acc, curr) => acc + (curr.properties.insects ?? 0), 0),
      gateways: gateways.length
    };
  }, [geoData]);

  const handleNavigateData = (gatewayId: number, sensorId?: number) => {
    const query = sensorId ? `?sensorId=${sensorId}` : '';
    navigate(`/gateways/${gatewayId}/sensors${query}`);
  }

  const handleClosePanel = () => {
    setSelectedFeature(null);
  };


  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 font-sans selection:bg-blue-500/30">
      <main className="max-w-full mx-auto px-0 sm:px-0 lg:px-0 pt-8 pb-32">
        <header className="mb-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <BackButton className="mb-3" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Farm Overview</h1>
            <p className="text-slate-500 mt-1">Real-time monitoring of your agricultural sectors.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/system-telemetry')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600"
            >
              <Activity size={15} />
              System Telemetry
            </button>
            <button
              onClick={() => navigate('/fruitfly-images')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600"
            >
              <Image size={15} />
              Fruitfly Images
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/gateways')}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6 text-left hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="bg-indigo-500/10 p-4 rounded-xl">
              <Bug className="text-indigo-500" size={28} />
            </div>
            <div>
              <h3 className="text-sm text-slate-500 font-medium">Total Sensors</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{sensorStats.total}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6 text-left hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="bg-emerald-500/10 p-4 rounded-xl">
              <Thermometer className="text-emerald-500" size={28} />
            </div>
            <div>
              <h3 className="text-sm text-slate-500 font-medium">Active Sensors</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{sensorStats.active}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/fruitfly-images')}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6 text-left hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="bg-rose-500/10 p-4 rounded-xl">
              <Bug className="text-rose-500" size={28} />
            </div>
            <div>
              <h3 className="text-sm text-slate-500 font-medium">Total Pests</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{sensorStats.pests}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/gateways')}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6 text-left hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="bg-sky-500/10 p-4 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M2 12h2"/><path d="M6 6.1_1.83.33-1.82.33-1.83L6 17.9"/><path d="M11.63 15.5H18v-3l-2.04-2.04a2.5 2.5 0 0 0-3.54 0L11.63 11V7.5a4.5 4.5 0 1 0-9 0V11l1.52 1.52a2.5 2.5 0 0 0 3.54 0L8.37 12H18"/><path d="M22 12h-2"/></svg>
            </div>
            <div>
              <h3 className="text-sm text-slate-500 font-medium">Gateways</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{sensorStats.gateways}</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/system-telemetry')}
            className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Latest Telemetry</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {telemetryPreview?.sensor_name ?? telemetryPreview?.gateway_name ?? 'No telemetry data yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Power: {telemetryPreview?.power ?? 'N/A'}W | Signal: {telemetryPreview?.signal_strength ?? 'N/A'}
            </p>
          </button>

          <button
            onClick={() => navigate('/fruitfly-images')}
            className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Image size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Latest Image</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {imagePreview?.sensor_name ?? 'No image data yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Status: {imagePreview?.analysis_status ?? 'N/A'}
            </p>
          </button>
        </div>

        {/* Map & Detail View */}
        <div className="relative">
          <div className="z-0 h-[55vh] min-h-[360px] lg:h-[600px]">
            <MapContainer
              center={[-6.7924, 39.2083]}
              zoom={6}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                referrerPolicy="strict-origin-when-cross-origin"
              />

              {geoData && (
                <>
                  <ZoomToMarker point={selectedPoint} />
                  <GeoJSON
                    data={geoData}
                    pointToLayer={pointToLayer}
                    onEachFeature={onEachFeature}
                  />
                </>
              )}
            </MapContainer>
            <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-slate-300">
              Live Feed: Precision Mode
            </div>
          </div>

          {selectedFeature ? (
            <DetailPanel 
              feature={selectedFeature} 
              geoData={geoData} 
              onClose={handleClosePanel}
              onNavigate={handleNavigateData}
            />
          ) : (
            <div className="relative mt-4 h-auto min-h-[180px] w-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-center text-slate-900 p-8 z-[1000] lg:absolute lg:top-0 lg:right-0 lg:mt-0 lg:h-full lg:w-1/3">
              <div className="flex flex-col items-center">
                <MapPin size={48} className="mb-4 text-slate-600" />
                <p className="text-sm text-slate-600">Click on a map marker to view detailed node analytics</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 px-4 sm:px-6 lg:px-8">
          <PageInfo title="Overview Guidance" blocks={contentBlocks} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
