import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/useAuth';
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>([]);
   const [sensorData, setSensorData] = useState<SensorData[]>([]);
  

  useEffect(() => {
    fetchSensors();
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

  const fetchSensors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sensors');
      setSensors(response.data);
    } catch (error) {
      console.error('Error fetching sensors:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.username}!</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sensor Map</h2>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={10}
          scrollWheelZoom={true}
          className="h-100 w-full">

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={22}
          />
          {/* Auto zoom to first sensor */}
          {sensors.length > 0 && (
            <SetMapView
              lat={sensors[0].location_lat}
              lng={sensors[0].location_lng}
              zoom={10}
            />
          )}
          {sensors.map((s) => (
            <Marker key={s.id} position={[s.location_lat, s.location_lng]}>
              {/* <Popup>
                <div>
                  <h3>{sensor.name}</h3>
                  <p>Status: {sensor.status}</p>
                  <FlyToMarker lat={sensor.location_lat} lng={sensor.location_lng} />
                </div>
              </Popup> */}
              <Popup >
                <div>
                  <b className='flex justify-center text-xl'>{s.name}</b>
                  <br />
                  <b className='flex justify-center text-xl'>{s.location}</b>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Sensors</h3>
          <p className="text-3xl font-bold text-blue-600">{sensors.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Active Sensors</h3>
          <p className="text-3xl font-bold text-green-600">
            {sensors.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Reports Generated</h3>
          <p className="text-3xl font-bold text-purple-600">12</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;