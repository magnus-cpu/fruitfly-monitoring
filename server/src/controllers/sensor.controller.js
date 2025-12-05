import db from '../config/database.js';
import { validationResult } from 'express-validator';

// Get all sensors for authenticated user
export const getSensors = async (req, res) => {
  try {
    const [sensors] = await db.execute(
      'SELECT id, name, description, location, location_lat, location_lng, status, created_at FROM sensors WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(sensors);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({ message: 'Failed to fetch sensors' });
  }
};

//get all sensors for admin
export const getAllSensors = async (req, res) => {
  try {
    const [sensors] = await db.execute(
      'SELECT id, name, description, location, location_lat, location_lng, status, created_at FROM sensors ORDER BY created_at DESC'
    );

    res.json(sensors);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({ message: 'Failed to fetch sensors' });
  }
};


// Get single sensor
export const getSensorById = async (req, res) => {
  try {
    const [sensors] = await db.execute(
      'SELECT id, name, description, location, location_lat, location_lng, status, created_at FROM sensors WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (sensors.length === 0) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json(sensors[0]);
  } catch (error) {
    console.error('Error fetching sensor:', error);
    res.status(500).json({ message: 'Failed to fetch sensor' });
  }
};

// Create new sensor
export const createSensor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, location, location_lat, location_lng } = req.body;

    const [result] = await db.execute(
      'INSERT INTO sensors (name, description, location, location_lat, location_lng, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, location, location_lat, location_lng, req.user.id]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Sensor created successfully',
      sensor: {
        id: result.insertId,
        name,
        location_lat,
        location_lng,
        status: 'active',
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating sensor:', error);
    res.status(500).json({ message: 'Failed to create sensor' });
  }
};

// Update sensor
export const updateSensor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, location, location_lat, location_lng } = req.body;

    const [result] = await db.execute(
      'UPDATE sensors SET name = ?, description = ?, location = ?, location_lat = ?, location_lng = ? WHERE id = ? AND user_id = ?',
      [name, description, location, location_lat, location_lng, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json({ message: 'Sensor updated successfully' });
  } catch (error) {
    console.error('Error updating sensor:', error);
    res.status(500).json({ message: 'Failed to update sensor' });
  }
};

// Delete sensor
export const deleteSensor = async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM sensors WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    res.status(500).json({ message: 'Failed to delete sensor' });
  }
};
