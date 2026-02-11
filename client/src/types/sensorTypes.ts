// export interface Sensor {
//   id: number;
//   name: string;
//   location: string;
//   location_lat: number;
//   location_lng: number;
//   status: string;
//   gateway_id: number; // 👈 IMPORTANT
// }

export interface Sensor {
  id: number;
  name: string;
  serial_number: string;
  description: string;
  location: string;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}

export interface Gateway {
  id: number;
  name: string;
  serial_number: string;
  description: string;
  location: string;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}

export interface Environmental {
  id: number;
  temperature: number;
  humidity: number;
  time_taken: string;
  created_at: string;
}

export interface Fruitfly {
  id: number;
  fruitfly_count: number;
  time_taken: string;
  created_at: string;
}
