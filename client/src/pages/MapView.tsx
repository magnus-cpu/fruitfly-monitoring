import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/Sapi';
import { useNavigate } from 'react-router-dom';


interface SensorData {
    id: number;
    temperature: number;
    humidity: number;
    created_at: string;
}

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

    const refreshLatest = useCallback(async (sensorList: Array<{ id: number }>) => {
        return Promise.all(
            sensorList.map(async (sensor) => {
                try {
                    const response = await api.get(`/sensor-data/${sensor.id}/data`);
                    const latest = response.data?.[response.data.length - 1] ?? null;
                    return [sensor.id, latest] as const;
                } catch (error) {
                    console.error(`Failed to load data for sensor ${sensor.id}`, error);
                    return [sensor.id, null] as const;
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
                    id: f.properties.id
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
        <div className="h-screen w-screen">
            <MapContainer
                center={[-37.8136, 144.9631]}
                zoom={6}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    maxZoom={22}
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
                                <div className="min-w-[180px]">
                                    <b className="text-slate-800">{properties.name}</b>
                                    <p className="text-xs text-slate-500 mt-1">{properties.location}</p>
                                    {properties.entity === 'gateway' ? (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-xs text-slate-600">Gateway node</p>
                                            <button
                                                onClick={() => navigate(`/gateways/${properties.id}/sensors`)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                                            >
                                                View data
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs mt-2">
                                                Status:{' '}
                                                <span
                                                    className={`font-semibold ${status === 'active' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}
                                                >
                                                    {status}
                                                </span>
                                            </p>
                                            {(temp !== undefined || hum !== undefined) && (
                                                <div className="text-xs text-slate-600 mt-2">
                                                    {temp !== undefined && <div>🌡️ {temp}°C</div>}
                                                    {hum !== undefined && <div>💧 {hum}%</div>}
                                                    {latest?.created_at && (
                                                        <div>
                                                            ⌛ {new Date(latest.created_at).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
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
    );
};

export default MapView;
