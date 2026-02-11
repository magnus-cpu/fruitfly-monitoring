import db from '../config/database.js';

/* Get a union data of cordinates for 
 gateway-parrent and all of its nodes/childrens
 for that user account
*/
export const getLocations = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
          g.id AS gateway_id,
          g.name AS gateway_name,
          g.location AS gateway_location,
          g.location_lat AS gateway_lat,
          g.location_lng AS gateway_lng,
          s.id AS sensor_id,
          s.name AS sensor_name,
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

    const [rows] = await db.query(sql, [userId]);

    const features = [];
    const gatewaySeen = new Set();

    for (const row of rows) {
      // Emit gateway ONLY ONCE
      if (!gatewaySeen.has(row.gateway_id)) {
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
            location: row.gateway_location,
            entity: 'gateway'
          }
        });
      }

      // Emit sensor
      if (row.sensor_id) {
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
            location: row.sensor_location,
            entity: 'sensor',
            gateway_id: row.gateway_id,
            temp: row.temperature,
            humidity: row.humidity,
            insects: row.fruitfly_count,
            activity_status: row.sensor_status
          }
        });
      }
    }

    res.json({
      type: 'FeatureCollection',
      features
    });

  } catch (error) {
    console.error('[getLocations]', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
