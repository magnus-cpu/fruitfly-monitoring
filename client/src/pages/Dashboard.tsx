
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/Sapi';
import {
  Thermometer, Bug, MapPin, Activity, Image, ArrowRight, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DetailPanel from '../components/DetailPanel';
import { PageInfo, type ContentBlock } from '../components/PageInfo';
import BackButton from '../components/BackButton';
import { formatLocalDateTime } from '../utils/datetime';

export interface SensorProperties {
  id: number;
  name: string;
  location: string;
  entity: 'sensor' | 'gateway';
  serial_number?: string;
  gateway_id?: number;
  gateway_serial_number?: string;
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
  time_taken: string | null;
  created_at: string;
}

interface ImagePreview {
  sensor_name: string;
  analysis_status: string;
  image_url: string;
  time_captured: string | null;
  created_at: string;
}

interface DashboardMetricProps {
  label: string;
  value: number | string;
  detail: string;
  accentClassName: string;
  iconClassName: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  onClick: () => void;
}

interface PreviewPanelProps {
  title: string;
  eyebrow: string;
  description: string;
  meta: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  onClick: () => void;
}

const formatStatusLabel = (value?: string | null) => {
  if (!value) return 'No status';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const DashboardMetric: React.FC<DashboardMetricProps> = ({
  label,
  value,
  detail,
  accentClassName,
  iconClassName,
  Icon,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-[26px] border border-white/10 bg-white/[0.08] p-5 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.12]"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClassName}`}>
        <Icon className={iconClassName} size={22} />
      </div>
    </div>
    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-200">
      {detail}
      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </div>
  </button>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  eyebrow,
  description,
  meta,
  Icon,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
        <Icon size={20} />
      </div>
    </div>
    <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
      <p className="text-xs font-medium text-slate-400">{meta}</p>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
        Open
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  </button>
);


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

const FitMapToFeatures: React.FC<{
  geoData: GeoJSONData | null;
  selectedPoint: [number, number] | null;
}> = ({ geoData, selectedPoint }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedPoint || !geoData?.features.length) return;

    const points = geoData.features
      .map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
      })
      .filter((point): point is [number, number] => point !== null);

    if (!points.length) return;

    if (points.length === 1) {
      map.flyTo(points[0], 12, {
        animate: true,
        duration: 1.1,
      });
      return;
    }

    map.flyToBounds(L.latLngBounds(points), {
      padding: [46, 46],
      maxZoom: 13,
      duration: 1.1,
    });
  }, [geoData, selectedPoint, map]);

  return null;
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
          Serial: ${properties.serial_number ?? 'N/A'}<br/>
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
          🔗 Gateway Serial: ${properties.gateway_serial_number ?? 'N/A'}
        </div>
      </div>
    `);
    }
  }, [geoData]);


  // Sensor stats
  const sensorStats = useMemo(() => {
    if (!geoData) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pests: 0,
        gateways: 0,
        coveragePoints: 0,
        coverageAreas: 0,
      };
    }

    const sensors = geoData.features.filter(f => f.properties.entity === 'sensor');
    const gateways = geoData.features.filter(f => f.properties.entity === 'gateway');
    const uniqueLocations = new Set(
      geoData.features
        .map((feature) => feature.properties.location)
        .filter(Boolean)
    );
    const active = sensors.filter(s => s.properties.activity_status === 'active').length;

    return {
      total: sensors.length,
      active,
      inactive: Math.max(sensors.length - active, 0),
      pests: sensors.reduce((acc, curr) => acc + (curr.properties.insects ?? 0), 0),
      gateways: gateways.length,
      coveragePoints: geoData.features.length,
      coverageAreas: uniqueLocations.size,
    };
  }, [geoData]);

  const activityRate = sensorStats.total > 0
    ? Math.round((sensorStats.active / sensorStats.total) * 100)
    : 0;

  const handleNavigateData = (gatewayId: number, sensorId?: number) => {
    const query = sensorId ? `?sensorId=${sensorId}` : '';
    navigate(`/gateways/${gatewayId}/sensors${query}`);
  }

  const handleClosePanel = () => {
    setSelectedFeature(null);
  };

  const selectedSummary = selectedFeature
    ? `${selectedFeature.entity === 'gateway' ? 'Gateway' : 'Sensor'} selected: ${selectedFeature.name}`
    : 'Select a gateway or sensor on the map to inspect its readings and open its data view.';


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_28%,_#f8fafc_100%)] text-slate-800 selection:bg-indigo-500/20">
      <main className="mx-auto max-w-[1600px] px-4 pb-32 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-emerald-950/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,#10231c_0%,#173227_55%,#0f1e18_100%)] text-white shadow-[0_24px_80px_-40px_rgba(16,24,20,0.78)]">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-10 lg:py-10">
            <div className="max-w-3xl">
              <BackButton className="mb-5 border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white" />
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
                <MapPin size={14} />
                Monitoring overview
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.8rem]">
                Monitoring overview
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                Track field activity, map coverage, and recent data.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/map')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Open full map
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/sensors')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Open sensors view
                </button>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-emerald-50/80">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  {sensorStats.coverageAreas} monitored areas
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  {activityRate}% active sensor rate
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  {sensorStats.inactive} need attention
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DashboardMetric
                label="Sensors"
                value={sensorStats.total}
                detail="Open sensor records"
                accentClassName="bg-emerald-500/20"
                iconClassName="text-emerald-100"
                Icon={Bug}
                onClick={() => navigate('/sensors')}
              />
              <DashboardMetric
                label="Active"
                value={sensorStats.active}
                detail="Check the live map"
                accentClassName="bg-lime-400/20"
                iconClassName="text-lime-100"
                Icon={Thermometer}
                onClick={() => navigate('/map')}
              />
              <DashboardMetric
                label="Fruitfly Count"
                value={sensorStats.pests}
                detail="Review captured images"
                accentClassName="bg-amber-400/20"
                iconClassName="text-amber-100"
                Icon={Image}
                onClick={() => navigate('/fruitfly-images')}
              />
              <DashboardMetric
                label="Gateways"
                value={sensorStats.gateways}
                detail="Manage gateway access"
                accentClassName="bg-emerald-300/20"
                iconClassName="text-emerald-50"
                Icon={MapPin}
                onClick={() => navigate('/gateways')}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Coverage workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Field map and node selection
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Click any gateway or sensor marker to open the side panel, review its latest field context, and jump straight into its data screen.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  onClick={() => navigate('/system-telemetry')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-600"
                >
                  <Activity size={16} />
                  Telemetry
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-600"
                >
                  <Image size={16} />
                  Reports
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-4 z-[1000] flex flex-wrap gap-2">
                <div className="rounded-full border border-slate-200 bg-white/[0.9] px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
                  {sensorStats.coveragePoints} mapped points
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50/[0.95] px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur">
                  {sensorStats.active} active sensors
                </div>
                <div className="rounded-full border border-amber-200 bg-amber-50/[0.95] px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm backdrop-blur">
                  {sensorStats.inactive} attention needed
                </div>
              </div>

              <div className="z-0 h-[60vh] min-h-[420px] lg:h-[720px]">
                <MapContainer
                  center={[-6.7924, 39.2083]}
                  zoom={6}
                  scrollWheelZoom
                  zoomControl={false}
                  className="h-full w-full"
                >
                  <ZoomControl position="topright" />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    referrerPolicy="strict-origin-when-cross-origin"
                  />

                  {geoData ? (
                    <>
                      <FitMapToFeatures geoData={geoData} selectedPoint={selectedPoint} />
                      <ZoomToMarker point={selectedPoint} />
                      <GeoJSON
                        data={geoData}
                        pointToLayer={pointToLayer}
                        onEachFeature={onEachFeature}
                      />
                    </>
                  ) : null}
                </MapContainer>
              </div>

              {selectedFeature ? (
                <DetailPanel
                  feature={selectedFeature}
                  geoData={geoData}
                  onClose={handleClosePanel}
                  onNavigate={handleNavigateData}
                />
              ) : (
                <div className="relative mt-4 border-t border-slate-200 bg-slate-50/80 p-5 text-slate-900 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-full lg:w-[360px] lg:border-l lg:border-t-0 lg:bg-white/[0.92] lg:backdrop-blur-xl lg:translate-x-[304px] lg:transition-transform lg:duration-300 lg:ease-out lg:hover:translate-x-0 lg:focus-within:translate-x-0">
                  <div className="hidden lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-14 lg:flex-col lg:items-center lg:justify-center lg:gap-3 lg:border-r lg:border-slate-200 lg:bg-gradient-to-b lg:from-emerald-50 lg:to-white">
                    <MapPin size={16} className="text-emerald-700" />
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Inspect
                    </span>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:ml-14">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                      <MapPin size={13} />
                      Selection ready
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      Choose a marker to inspect its field details
                    </h3>
                    <p className="mt-2.5 text-xs leading-5 text-slate-500">
                      {selectedSummary}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mapped points</p>
                        <p className="mt-1.5 text-xl font-semibold text-slate-900">{sensorStats.coveragePoints}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Coverage areas</p>
                        <p className="mt-1.5 text-xl font-semibold text-slate-900">{sensorStats.coverageAreas}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active rate</p>
                        <p className="mt-1.5 text-xl font-semibold text-slate-900">{activityRate}%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/map')}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      Open dedicated map page
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <PreviewPanel
              title={telemetryPreview?.sensor_name ?? telemetryPreview?.gateway_name ?? 'No telemetry captured yet'}
              eyebrow="Latest telemetry"
              description={
                telemetryPreview
                  ? `${telemetryPreview.power ?? 'N/A'}W power, signal ${telemetryPreview.signal_strength ?? 'N/A'}.`
                  : 'No telemetry record yet.'
              }
              meta={
                (telemetryPreview?.time_taken ?? telemetryPreview?.created_at)
                  ? `Updated ${formatLocalDateTime(telemetryPreview?.time_taken ?? telemetryPreview?.created_at)}`
                  : 'Waiting for telemetry records'
              }
              Icon={Activity}
              onClick={() => navigate('/system-telemetry')}
            />

            <PreviewPanel
              title={imagePreview?.sensor_name ?? 'No image capture yet'}
              eyebrow="Latest image"
              description={
                imagePreview
                  ? `Status: ${formatStatusLabel(imagePreview.analysis_status)}.`
                  : 'No image capture yet.'
              }
              meta={
                (imagePreview?.time_captured ?? imagePreview?.created_at)
                  ? `Captured ${formatLocalDateTime(imagePreview?.time_captured ?? imagePreview?.created_at)}`
                  : 'Waiting for image records'
              }
              Icon={Image}
              onClick={() => navigate('/fruitfly-images')}
            />

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
                Quick focus
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Where to go next</h3>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                    onClick={() => navigate('/gateways')}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Gateway management</p>
                    <p className="mt-1 text-xs text-slate-500">{sensorStats.gateways} gateways in this account.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/sensors')}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sensor data</p>
                    <p className="mt-1 text-xs text-slate-500">{sensorStats.total} sensors, {sensorStats.active} active.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Reports</p>
                    <p className="mt-1 text-xs text-slate-500">{sensorStats.coverageAreas} areas, {sensorStats.inactive} need follow-up.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </aside>
        </section>

        <div className="mt-10">
          <PageInfo title="Overview Guidance" blocks={contentBlocks} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
