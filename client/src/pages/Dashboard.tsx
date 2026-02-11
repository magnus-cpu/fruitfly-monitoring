
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/Sapi';
import {
  Thermometer, Droplets, Bug, MapPin,
  LucideEye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageInfo, type ContentBlock } from '../components/PageInfo';

interface SensorProperties {
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

interface GeoFeature {
  type: 'Feature';
  properties: SensorProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoFeature[];
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

// Component to fit map bounds to all markers on load
// const FitBounds: React.FC<{ data: GeoJSONData }> = ({ data }) => {
//   const map = useMap();
//   const hasFit = React.useRef(false);

//   useEffect(() => {
//     if (!data || !data.features.length || hasFit.current) return;

//     const bounds = L.latLngBounds(
//       data.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
//     );

//     map.fitBounds(bounds, { padding: [50, 50] });
//     hasFit.current = true;
//   }, [data, map]);

//   return null;
// };

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

  const handleNavigateData = async (id: number) => {
    navigate(`/gateways/${id}/sensors`);

  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-200 font-sans selection:bg-blue-500/30">
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-widest">Farm Overview</h1>
          <p className="text-slate-500 mt-1">Monitoring multiple sectors with live sensor data.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 overflow-hidden">
            <h3 className="text-sm text-slate-800 font-semibold">Total Sensors</h3>
            <p className="text-2xl text-slate-600 mt-1">{sensorStats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 overflow-hidden">
            <h3 className="text-sm text-slate-800 font-semibold">Active Sensors</h3>
            <p className="text-2xl text-slate-600 mt-1">{sensorStats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 overflow-hidden">
            <h3 className="text-sm text-slate-800 font-semibold">Total Pests</h3>
            <p className="text-2xl text-slate-600 mt-1">{sensorStats.pests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 overflow-hidden">
            <h3 className="text-sm text-slate-800 font-semibold">Gateways</h3>
            <p className="text-2xl text-slate-600 mt-1">{sensorStats.gateways}</p>
          </div>
        </div>

        {/* Map & Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[580px] md:h-[140vh]">
          <div className="lg:col-span-2 z-0 relative rounded-3xl overflow-hidden border border-slate-500/50 shadow-lg">
            <MapContainer
              center={[-6.7924, 39.2083]}
              zoom={6}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {geoData && (
                <>
                  {/* <FitBounds data={geoData} /> */}
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

          {/* Detail Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
            {selectedFeature ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedFeature.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedFeature.entity === 'gateway' ? 'Gateway Node' : 'Sensor Node'}
                  </p>
                </div>

                {selectedFeature.entity === 'gateway' ? (
                  // Gateway Details
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                      <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Location</p>
                      <p className="text-lg font-bold text-slate-600">{selectedFeature.location}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                      <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Gateway ID</p>

                      <div className='flex justify-between  py-1 px-4'>
                        <p className="text-lg font-bold text-slate-600">{selectedFeature.id}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNavigateData(selectedFeature.id); }}
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
                          f => f.properties.entity === 'sensor' && f.properties.gateway_id === selectedFeature.id
                        ).length ?? 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Sensor Details
                  <div className="space-y-4">
                    {selectedFeature.activity_status && (
                      <p className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${selectedFeature.activity_status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                        }`}>
                        {selectedFeature.activity_status}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                        <Thermometer className="text-orange-400 mb-2" size={30} />
                        <p className="text-xs font-semibold tracking-widest text-slate-800">Temperature</p>
                        <p className="text-xl font-bold text-slate-600">{selectedFeature.temp ?? 'N/A'}°C</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                        <Droplets className="text-blue-400 mb-2" size={30} />
                        <p className="text-xs font-semibold tracking-widest text-slate-800">Humidity</p>
                        <p className="text-xl font-bold text-slate-600">{selectedFeature.humidity ?? 'N/A'}%</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                      <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Location</p>
                      <p className="text-lg font-bold text-slate-600">{selectedFeature.location}</p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-400/50">
                      <p className="text-xs font-semibold tracking-widest text-slate-800 mb-2">Gateway ID</p>
                      <div className='flex justify-between  py-1 px-4'>
                        <p className="text-lg font-bold text-slate-600">{selectedFeature.gateway_id ?? 'N/A'}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNavigateData(Number(selectedFeature.gateway_id)); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md border border-slate-200 shadow-sm transition-all"
                        >
                          <LucideEye size={14} />
                          <span className="text-xs font-medium whitespace-nowrap">View Data</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-slate-500/50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-rose-500">
                          <Bug size={20} />
                          <span className="font-bold">Insect Count</span>
                        </div>
                        <span className="text-xl font-black text-rose-500">{selectedFeature.insects ?? 0}</span>
                      </div>
                      <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-400 transition-all duration-1000"
                          style={{ width: `${Math.min((selectedFeature.insects ?? 0) * 2, 100)}%` }}
                        />
                      </div>
                      <p className="text-[12px] text-slate-500 mt-2">Threshold: 50 per node</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-900 p-8 opacity-40">
                <MapPin size={48} className="mb-4" />
                <p className="text-sm">Click on a map marker to view detailed node analytics</p>
              </div>
            )}
            <button className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20">
              Download Sector Report
            </button>
          </div>
        </div>

        <div className="mt-10">
          <PageInfo title="Overview Guidance" blocks={contentBlocks} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
