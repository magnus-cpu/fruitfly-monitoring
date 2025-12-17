import db from '../config/database.js';
import { validationResult } from 'express-validator';


// Helper function to generate node serial number based on gateway
const generateNodeSerial = async (gatewayId) => {
  try {
    // Get gateway serial number
    const [gatewayRows] = await db.execute(
      'SELECT serial_number FROM gateways WHERE id = ?',
      [gatewayId]
    );

    if (gatewayRows.length === 0) {
      throw new Error('Gateway not found');
    }

    const gatewaySerial = gatewayRows[0].serial_number; // e.g., eFF-G-001

    // Get the last node number for this gateway
    const [nodeRows] = await db.execute(
      'SELECT serial_number FROM sensors WHERE gateway_id = ? ORDER BY id DESC LIMIT 1',
      [gatewayId]
    );

    let nextNodeNumber = 1;

    if (nodeRows.length > 0) {
      const lastSerial = nodeRows[0].serial_number;
      // Extract node number from format: eFF-G-001-N-005
      const match = lastSerial.match(/-N-(\d+)$/);
      if (match) {
        nextNodeNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: eFF-G-001-N-001, eFF-G-001-N-002, etc.
    return `${gatewaySerial}-N-${String(nextNodeNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating node serial:', error);
    throw error;
  }
};

// Create new sensor/node
export const createNode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, gateway_id, location, location_lat, location_lng, description } = req.body;

    // Verify gateway exists and belongs to user
    const [gatewayRows] = await db.execute(
      'SELECT id FROM gateways WHERE id = ? AND user_id = ?',
      [gateway_id, req.user.id]
    );

    if (gatewayRows.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Gateway not found or access denied'
      });
    }

    // Generate serial number based on gateway
    const serial_number = await generateNodeSerial(gateway_id);

    const [result] = await db.execute(
      'INSERT INTO sensors (name, serial_number, gateway_id, location, location_lat, location_lng, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, serial_number, gateway_id, location, location_lat, location_lng, description, req.user.id]
    );

    res.status(201).json({
      status: true,
      id: result.insertId,
      message: 'Sensor created successfully',
      sensor: {
        id: result.insertId,
        serial_number,
        name,
        gateway_id,
        location,
        location_lat,
        location_lng,
        description,
        status: 'active',
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating Sensor:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to create Sensor',
      error: error.message
    });
  }
};

// Update node
export const updateNode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, location, location_lat, location_lng, status } = req.body;

    const [result] = await db.execute(
      'UPDATE sensors SET name = ?, description = ?, location = ?, location_lat = ?, location_lng = ?, status = ? WHERE id = ? AND user_id = ?',
      [name, description, location, location_lat, location_lng, status, req.params.id, req.user.id]
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

// Delete node
export const deleteNode = async (req, res) => {
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



// Get all sensors for authenticated user
export const getSensors = async (req, res) => {
  try {
    const [sensors] = await db.execute(
      'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM sensors WHERE user_id = ? ORDER BY created_at DESC',
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
      'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM sensors ORDER BY created_at DESC'
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
      'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM sensors WHERE id = ? AND user_id = ?',
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
