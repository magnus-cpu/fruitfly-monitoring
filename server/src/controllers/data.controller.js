import pool from '../config/database.js';

// Get env data
export const getEnvironmentalData = async (req, res) => {
  try {
    // GET sensor id from serial_number
    const [sensorRows] = await pool.execute
      (
        'SELECT id FROM sensors WHERE serial_number = ?',
        [req.params.serial_number]
      );


    if (sensorRows.length === 0) {
      return res.status(400).json({ 
        status: false,
        message: 'Sensor ID not registered'
      })
    }

    const sensorId = sensorRows[0].id;

    const [data] = await pool.execute(
      `SELECT id, temperature, humidity, time_taken, created_at 
       FROM environmental_readings 
       WHERE sensor_id = ? 
       ORDER BY time_taken DESC 
       LIMIT 5`,
      [sensorId]
    );

    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ message: 'Failed to fetch sensor data' });
  }
};

// Get combined env + counts data
export const getCombinedData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serial_number } = req.params;

    // 1️⃣ Validate sensor ownership
    const [sensors] = await pool.execute(
      'SELECT id FROM sensors WHERE serial_number = ? AND user_id = ?',
      [serial_number, userId]
    );

    if (sensors.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Sensor not registered to this user',
      });
    }

    const sensorId = sensors[0].id;

    // 2️⃣ Fetch last 5 environmental readings
    const [envReadings] = await pool.execute(
      `
      SELECT 
        id,
        temperature,
        humidity,
        time_taken,
        created_at
      FROM environmental_readings
      WHERE sensor_id = ?
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [sensorId]
    );

    // 3️⃣ Fetch last 5 fruitfly counts
    const [fruitflyCounts] = await pool.execute(
      `
      SELECT
        id,
        fruitfly_count,
        time_taken,
        created_at
      FROM fruitfly_counts
      WHERE sensor_id = ?
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [sensorId]
    );

    // 4️⃣ Return combined but independent data
    res.json({
      status: true,
      sensor_id: sensorId,
      environmental: envReadings,
      fruitfly: fruitflyCounts,
    });
  } catch (error) {
    console.error('Error fetching combined sensor data:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch sensor data',
    });
  }
};
