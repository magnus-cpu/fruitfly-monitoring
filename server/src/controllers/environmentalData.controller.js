import db from '../config/database.js';
import { validationResult } from 'express-validator';

// To store environmental data 
export const storeEnvironmentalData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { serial_number, temperature, humidity, time_taken } = req.body;

    // GET sensor id from serial_number
    const [sensorRows] = await db.execute
      (
        'SELECT id FROM sensors WHERE serial_number = ?',
        [serial_number]
      );


    if (sensorRows.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Sensor ID not registered'
      })
    }

    const sensorId = sensorRows[0].id;

    const [result] = await db.execute(
      'INSERT INTO environmental_readings (sensor_id, temperature, humidity, time_taken) VALUES (?, ?, ?, ?)',
      [sensorId, temperature, humidity, time_taken]
    );

    res.status(201).json({
      status: true,
      message: 'Environmental data stored successfully'
    });
  } catch (error) {
    console.error('Error adding sensor data:', error);
    res.status(500).json({
      message: 'Failed to add sensor data',
      error: error.message
    });
  }
};