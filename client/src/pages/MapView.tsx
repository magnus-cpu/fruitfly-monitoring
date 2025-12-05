import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import type { Sensor } from '../types/sensorTypes';
import type { SetMapViewProps, FlyToMarkerProps } from '../types/mapTypes';


interface SensorData {
    id: number;
    temperature: number;
    humidity: number;
    created_at: string;
}

const SetMapView: React.FC<SetMapViewProps> = ({ lat, lng, zoom = 12 }) => {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], zoom);
        }
    }, [lat, lng, zoom, map]);

    return null;
};


const FlyToMarker: React.FC<FlyToMarkerProps> = ({ lat, lng }) => {
    const map = useMap();

    // Smooth fly animation to the marker
    map.flyTo([lat, lng], 16, {
        duration: 1.5,
    });

    return null; // no UI, only behavior
};


/* optional coloured fruit-fly icon */
// const flyIcon = new Icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png',
//     // iconSize: [32, 32],
// });

const MapView: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorData, setSensorData] = useState<SensorData[]>([]);


    useEffect(() => {
        axios.get('http://localhost:5000/api/sensors').then(({ data }) => setSensors(data));
    }, []);

    useEffect(() => {
        const fetchData = async (sensorId: number) => {
            const response = await axios.get(`http://localhost:5000/api/sensor-data/${sensorId}/data`);
            setSensorData(response.data);
        };

        if (sensors.length > 0) {
            fetchData(sensors[0].id);
        }
    }, [sensors]);

    return (
        <div className="h-screen w-screen">
            <MapContainer
                center={[-37.8136, 144.9631]}   // Melbourne – change to your area
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={22}
                />
                {/* Auto zoom to first sensor */}
                {sensors.length > 0 && (
                    <SetMapView
                        lat={sensors[0].location_lat}
                        lng={sensors[0].location_lng}
                        zoom={6}
                    />
                )}

                {sensors.map((s) => (
                    <Marker
                        key={s.id}
                        position={[s.location_lat, s.location_lng]}
                    // icon={flyIcon}
                    >
                        <Popup>
                            <div>
                                <b>{s.name}</b>
                                <br />
                                {s.location}
                                <br />
                                Status:{" "}
                                <span
                                    className={`font-semibold ${s.status === "active" ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {s.status}
                                </span>

                                <br />

                                {sensorData.length > 0 && (() => {
                                    const latest = sensorData[sensorData.length - 1];
                                    const temp = latest.temperature;
                                    const hum = latest.humidity;

                                    // Temperature color and message
                                    let tempColor = "text-green-600";
                                    let tempLabel = "Ideal";

                                    if (temp < 18) {
                                        tempColor = "text-blue-500";
                                        tempLabel = "Cold";
                                    } else if (temp > 30) {
                                        tempColor = "text-red-600";
                                        tempLabel = "Hot";
                                    }

                                    // Humidity color and message
                                    let humColor = "text-green-600";
                                    let humLabel = "Comfortable";

                                    if (hum < 40) {
                                        humColor = "text-yellow-600";
                                        humLabel = "Dry";
                                    } else if (hum > 70) {
                                        humColor = "text-blue-700";
                                        humLabel = "Humid";
                                    }

                                    return (
                                        <>
                                            🌡️ Temp:{" "}
                                            <b className={tempColor}>
                                                {temp}°C ({tempLabel})
                                            </b>
                                            <br />
                                            💧 Humidity:{" "}
                                            <b className={humColor}>
                                                {hum}% ({humLabel})
                                            </b>
                                            <br />
                                            ⌛ Last updated:{" "}
                                            {new Date(sensorData[0]?.created_at).toLocaleString()}
                                        </>
                                    );
                                })()}

                                <FlyToMarker lat={s.location_lat} lng={s.location_lng} />
                            </div>
                        </Popup>

                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;