import db from '../config/database.js';
import { validationResult } from 'express-validator';

// Get sensor data
export const getSensorData = async (req, res) => {
  try {
    const [data] = await db.execute(
      `SELECT id, temperature, humidity, created_at 
       FROM sensor_data 
       WHERE sensor_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`, 
      [req.params.id]
    );

    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ message: 'Failed to fetch sensor data' });
  }
};

// Add sensor data
export const addSensorData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { sensor_id, temperature, humidity} = req.body;

    // Verify sensor belongs to user
    const [sensors] = await db.execute(
      'SELECT id FROM sensors WHERE id = ?',
      [sensor_id]
    );

    if (sensors.length === 0) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    const [result] = await db.execute(
      'INSERT INTO sensor_data (sensor_id, temperature, humidity) VALUES (?, ?, ?)',
      [sensor_id, temperature, humidity]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Sensor data added successfully'
    });
  } catch (error) {
    console.error('Error adding sensor data:', error);
    res.status(500).json({ message: 'Failed to add sensor data' });
  }
};