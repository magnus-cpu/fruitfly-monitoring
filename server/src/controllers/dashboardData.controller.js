import pool from '../config/database.js';
import { getOwnerUserId } from '../services/access.service.js';

const buildLocationResponse = (rows) => {
  const features = [];
  const gatewaySeen = new Set();

  for (const row of rows) {
    if (row.gateway_id && !gatewaySeen.has(row.gateway_id) && row.gateway_lat !== null && row.gateway_lng !== null) {
      gatewaySeen.add(row.gateway_id);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            Number(row.gateway_lng),
            Number(row.gateway_lat)
          ]
        },
        properties: {
          id: row.gateway_id,
          name: row.gateway_name,
          serial_number: row.gateway_serial_number,
          location: row.gateway_location,
          entity: 'gateway'
        }
      });
    }

    if (row.sensor_id && row.sensor_lat !== null && row.sensor_lng !== null) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            Number(row.sensor_lng),
            Number(row.sensor_lat)
          ]
        },
          properties: {
            id: row.sensor_id,
            name: row.sensor_name,
            serial_number: row.serial_number,
            location: row.sensor_location,
            entity: 'sensor',
            gateway_id: row.gateway_id,
            gateway_serial_number: row.gateway_serial_number,
            temp: row.temperature,
            humidity: row.humidity,
            insects: row.fruitfly_count,
          activity_status: row.sensor_status
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

/* Get a union data of cordinates for 
 gateway-parrent and all of its nodes/childrens
 for that user account
*/
export const getLocations = async (req, res) => {
  try {
    const userId = getOwnerUserId(req.user);

    const sql = `
      SELECT
          g.id AS gateway_id,
          g.name AS gateway_name,
          g.serial_number AS gateway_serial_number,
          g.location AS gateway_location,
          g.location_lat AS gateway_lat,
          g.location_lng AS gateway_lng,
          s.id AS sensor_id,
          s.name AS sensor_name,
          s.serial_number AS serial_number,
          s.location AS sensor_location,
          s.location_lat AS sensor_lat,
          s.location_lng AS sensor_lng,
          s.status AS sensor_status,
          (SELECT temperature FROM environmental_readings WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS temperature,
          (SELECT humidity FROM environmental_readings WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS humidity,
          (SELECT fruitfly_count FROM fruitfly_counts WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS fruitfly_count
      FROM gateways g
      LEFT JOIN sensors s ON s.gateway_id = g.id
      WHERE g.user_id = ?
      ORDER BY g.id;
    `;

    const [rows] = await pool.query(sql, [userId]);
    res.json(buildLocationResponse(rows));

  } catch (error) {
    console.error('[getLocations]', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const getPublicLandingLocations = async (req, res) => {
  try {
    const sql = `
      SELECT
          g.id AS gateway_id,
          g.name AS gateway_name,
          g.serial_number AS gateway_serial_number,
          g.location AS gateway_location,
          g.location_lat AS gateway_lat,
          g.location_lng AS gateway_lng,
          s.id AS sensor_id,
          s.name AS sensor_name,
          s.serial_number AS serial_number,
          s.location AS sensor_location,
          s.location_lat AS sensor_lat,
          s.location_lng AS sensor_lng,
          s.status AS sensor_status,
          (SELECT temperature FROM environmental_readings WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS temperature,
          (SELECT humidity FROM environmental_readings WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS humidity,
          (SELECT fruitfly_count FROM fruitfly_counts WHERE sensor_id = s.id ORDER BY created_at DESC LIMIT 1) AS fruitfly_count
      FROM gateways g
      LEFT JOIN sensors s ON s.gateway_id = g.id
      ORDER BY g.id;
    `;

    const [rows] = await pool.query(sql);
    const geoJson = buildLocationResponse(rows);
    const gateways = geoJson.features.filter((feature) => feature.properties.entity === 'gateway');
    const sensors = geoJson.features.filter((feature) => feature.properties.entity === 'sensor');

    res.json({
      ...geoJson,
      summary: {
        gateways: gateways.length,
        sensors: sensors.length,
        activeSensors: sensors.filter(
          (feature) => feature.properties.activity_status === 'active'
        ).length,
        coverageAreas: new Set(
          geoJson.features
            .map((feature) => feature.properties.location)
            .filter(Boolean)
        ).size
      }
    });
  } catch (error) {
    console.error('[getPublicLandingLocations]', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
