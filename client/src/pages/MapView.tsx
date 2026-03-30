import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/Sapi';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { formatLocalDateTime } from '../utils/datetime';


interface SensorData {
    temperature?: number;
    humidity?: number;
    fruitfly_count?: number;
    power?: number;
    cpu_temp?: number;
    created_at?: string;
    time_taken?: string;
}

interface SensorProperties {
    id: number;
    name: string;
    serial_number: string;
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

const activeIcon = new L.Icon({
    iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const inactiveIcon = new L.Icon({
    iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/grey-dot.png',
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

const FitToLocations: React.FC<{ features: GeoFeature[] }> = ({ features }) => {
    const map = useMap();
    const hasFit = useRef(false);

    useEffect(() => {
        if (!features.length || hasFit.current) return;

        const bounds = L.latLngBounds(
            features.map(s => [s.geometry.coordinates[1], s.geometry.coordinates[0]])
        );
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });
        hasFit.current = true;
    }, [features, map]);

    return null;
};

const FlyToSelected: React.FC<{ point: [number, number] | null }> = ({ point }) => {
    const map = useMap();

    useEffect(() => {
        if (!point) return;
        const currentZoom = map.getZoom();
        map.flyTo(point, Math.max(currentZoom, 12), {
            animate: true,
            duration: 0.9,
        });
    }, [point, map]);

    return null;
};

const MapView: React.FC = () => {
    const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
    const [latestBySensor, setLatestBySensor] = useState<Record<number, SensorData | null>>({});
    const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadLocations = async () => {
            try {
                const { data } = await api.get('/locations');
                setGeoData(data);
            } catch (error) {
                console.error('Failed to load locations', error);
            }
        };
        loadLocations();
    }, []);

    const refreshLatest = useCallback(async (sensorList: Array<{ serial_number: string }>) => {
        return Promise.all(
            sensorList.map(async (sensor) => {
                try {
                    const combinedResponse = await api.get(`/fruitfly/${sensor.serial_number}/combined_data`);
                    const latestEnv = combinedResponse.data?.environmental?.[0] ?? null;
                    const latestCount = combinedResponse.data?.fruitfly?.[0] ?? null;
                    const latestTelemetry = combinedResponse.data?.telemetry?.[0] ?? null;
                    const latest = latestEnv || latestCount
                        ? {
                            temperature: latestEnv?.temperature,
                            humidity: latestEnv?.humidity,
                            fruitfly_count: latestCount?.fruitfly_count,
                            power: latestTelemetry?.power,
                            cpu_temp: latestTelemetry?.cpu_temp,
                            created_at: latestEnv?.created_at || latestCount?.created_at,
                            time_taken: latestEnv?.time_taken || latestCount?.time_taken
                        }
                        : null;
                    return [sensor.serial_number, latest] as const;
                } catch (error) {
                    console.error(`Failed to load data for sensor ${sensor.serial_number}`, error);
                    return [sensor.serial_number, null] as const;
                }
            })
        );
    }, []);

    useEffect(() => {
        const sensorFeatures = geoData?.features.filter(
            f => f.properties.entity === 'sensor'
        ) ?? [];
        if (!sensorFeatures.length) return;
        let cancelled = false;

        const fetchLatest = async () => {
            const entries = await refreshLatest(
                sensorFeatures.map(f => ({
                    serial_number: f.properties.serial_number
                }))
            );
            if (!cancelled) {
                setLatestBySensor(Object.fromEntries(entries));
            }
        };

        fetchLatest();
        const interval = window.setInterval(fetchLatest, 20000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [geoData, refreshLatest]);

    const features = geoData?.features ?? [];
    const sensorFeatures = features.filter(
        f => f.properties.entity === 'sensor'
    );
    const gatewayById = useMemo(() => {
        const entries = features
            .filter(f => f.properties.entity === 'gateway')
            .map(f => [f.properties.id, f] as const);
        return Object.fromEntries(entries) as Record<number, GeoFeature>;
    }, [features]);

    return (
        <div className="min-h-screen w-full bg-slate-100 px-2 sm:px-4 lg:px-6 py-6">
            <div className="w-full">
                <div className="mb-4">
                    <BackButton />
                </div>
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-900">Network Map</h1>
                    <p className="text-sm text-slate-500 mt-1">Sensor and gateway locations with live status links.</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-[78vh] min-h-[520px] lg:h-[calc(100vh-11rem)] z-0">
            <MapContainer
                center={[-37.8136, 144.9631]}
                zoom={6}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    maxZoom={22}
                    referrerPolicy="strict-origin-when-cross-origin"
                />

                {features.length > 0 && (
                    <>
                        <FitToLocations features={features} />
                        <FlyToSelected point={selectedPoint} />
                    </>
                )}

                {features.map((feature) => {
                    const { properties, geometry } = feature;
                    const latest = properties.entity === 'sensor'
                        ? latestBySensor[properties.id] ?? null
                        : null;
                    const status = properties.activity_status ?? 'inactive';
                    const temp = latest?.temperature ?? properties.temp;
                    const hum = latest?.humidity ?? properties.humidity;
                    const insects = latest?.fruitfly_count ?? properties.insects;
                    const power = latest?.power;
                    const cpuTemp = latest?.cpu_temp;
                    const icon = properties.entity === 'gateway'
                        ? gatewayIcon
                        : (status === 'active' ? activeIcon : inactiveIcon);
                    return (
                        <Marker
                            key={properties.id}
                            position={[geometry.coordinates[1], geometry.coordinates[0]]}
                            icon={icon}
                            eventHandlers={{
                                click: () => setSelectedPoint([geometry.coordinates[1], geometry.coordinates[0]]),
                            }}
                        >
                            <Popup>
                                <div className="min-w-[230px] max-w-[270px] p-1 relative map-popup-card rounded-xl">
                                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-emerald-200/30 rounded-full blur-2xl animate-pulse" />
                                    <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl animate-pulse" />
                                    <div className="relative z-10">
                                    <div className="flex items-center justify-between gap-2">
                                        <b className="text-slate-800">{properties.name}</b>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            {status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{properties.location}</p>
                                    {properties.entity === 'gateway' ? (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-xs text-slate-600">Gateway node</p>
                                            <p className="text-xs text-slate-500">Gateway ID: {properties.id}</p>
                                            <button
                                                onClick={() => navigate(`/gateways/${properties.id}/sensors`)}
                                                className="mt-1 inline-flex items-center justify-center w-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1.5 rounded-md transition-colors"
                                            >
                                                View More Data
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-xs text-slate-600 mt-2 space-y-1.5">
                                                <div><span className="font-semibold text-slate-700">Serial:</span> {properties.serial_number ?? 'N/A'}</div>
                                                <div><span className="font-semibold text-slate-700">Gateway ID:</span> {properties.gateway_id ?? 'N/A'}</div>
                                                <div><span className="font-semibold text-slate-700">Temperature:</span> {temp ?? 'N/A'}°C</div>
                                                <div><span className="font-semibold text-slate-700">Humidity:</span> {hum ?? 'N/A'}%</div>
                                                <div><span className="font-semibold text-slate-700">Insects:</span> {insects ?? 0}</div>
                                                <div><span className="font-semibold text-slate-700">Power:</span> {power ?? 'N/A'}W</div>
                                                <div><span className="font-semibold text-slate-700">CPU Temp:</span> {cpuTemp ?? 'N/A'}°C</div>
                                                <div><span className="font-semibold text-slate-700">Coordinates:</span> {geometry.coordinates[1].toFixed(5)}, {geometry.coordinates[0].toFixed(5)}</div>
                                                {(latest?.time_taken || latest?.created_at) ? (
                                                    <div><span className="font-semibold text-slate-700">Updated:</span> {formatLocalDateTime(latest.time_taken ?? latest.created_at)}</div>
                                                ) : null}
                                            </div>
                                            {properties.gateway_id ? (
                                                <button
                                                    onClick={() => navigate(`/gateways/${properties.gateway_id}/sensors?sensorId=${properties.id}`)}
                                                    className="mt-3 inline-flex items-center justify-center w-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1.5 rounded-md transition-colors"
                                                >
                                                    View More Data
                                                </button>
                                            ) : null}
                                        </>
                                    )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {sensorFeatures.map((sensor) => {
                    const gateway = sensor.properties.gateway_id
                        ? gatewayById[sensor.properties.gateway_id]
                        : null;
                    if (!gateway) return null;
                    const sensorPoint: [number, number] = [
                        sensor.geometry.coordinates[1],
                        sensor.geometry.coordinates[0],
                    ];
                    const gatewayPoint: [number, number] = [
                        gateway.geometry.coordinates[1],
                        gateway.geometry.coordinates[0],
                    ];
                    return (
                        <Polyline
                            key={`link-${sensor.properties.id}-${gateway.properties.id}`}
                            positions={[gatewayPoint, sensorPoint]}
                            pathOptions={{ color: '#94a3b8', weight: 2, opacity: 0.7 }}
                        />
                    );
                })}
            </MapContainer>
                </div>
            </div>
            <style>{`
                @keyframes mapPopupShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .map-popup-card {
                    background: linear-gradient(120deg, rgba(255,255,255,0.92), rgba(236,253,245,0.92), rgba(239,246,255,0.92), rgba(255,255,255,0.92));
                    background-size: 220% 220%;
                    animation: mapPopupShift 10s ease-in-out infinite;
                    border: 1px solid rgba(167, 243, 208, 0.7);
                }
            `}</style>
        </div>
    );
};

export default MapView;
