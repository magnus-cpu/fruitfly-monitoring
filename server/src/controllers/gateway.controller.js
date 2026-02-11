import db from '../config/database.js';
import { validationResult } from 'express-validator';

// Helper function to generate gateway serial number
const generateGatewaySerial = async () => {
    try {
        // Get the last gateway serial number
        const [rows] = await db.execute(
            'SELECT serial_number FROM gateways ORDER BY id DESC LIMIT 1'
        );

        let nextNumber = 1;

        if (rows.length > 0) {
            const lastSerial = rows[0].serial_number;
            // Extract number from format: eFF-G-000
            const match = lastSerial.match(/eFF-G-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        // Format: eFF-G-000, eFF-G-001, etc.
        return `eFF-G-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating gateway serial:', error);
        throw error;
    }
};

// Create new gateway
export const createGateWay = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, description, location, location_lat, location_lng } = req.body;

        // Generate serial number automatically
        const serial_number = await generateGatewaySerial();

        const [result] = await db.execute(
            'INSERT INTO gateways (name, serial_number, description, location, location_lat, location_lng, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, serial_number, description, location, location_lat, location_lng, req.user.id]
        );

        res.status(201).json({
            status: true,
            id: result.insertId,
            message: 'Gateway created successfully',
            gateway: {
                id: result.insertId,
                serial_number,
                name,
                description,
                location,
                location_lat,
                location_lng,
                status: 'active',
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Error creating Gateway:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to create Gateway',
            error: error.message
        });
    }
};

// Update Gateway
export const updateGateway = async (req, res) => {
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
            'UPDATE gateways SET name = ?, description = ?, location = ?, location_lat = ?, location_lng = ? WHERE id = ? AND user_id = ?',
            [name, description, location, location_lat, location_lng, req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gateway not found' });
        }

        res.json({ message: 'Gateway updated successfully' });
    } catch (error) {
        console.error('Error updating Gateway:', error);
        res.status(500).json({ message: 'Failed to update Gateway' });
    }
};

// Delete gateway
export const deleteGateway = async (req, res) => {
    try {
        const [sensors] = await db.execute(
            'SELECT id FROM sensors WHERE gateway_id = ?',
            [req.params.id]
        );

        if (sensors.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete gateway with attached sensors'
            });
        }

        const [result] = await db.execute(
            'DELETE FROM gateways WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gateway not found' });
        }

        res.json({ message: 'Gateway deleted successfully' });
    } catch (error) {
        console.error('Error deleting Gateway:', error);
        res.status(500).json({ message: 'Failed to delete Gateway' });
    }
};




// Get all Gateways for authenticated user
export const getGateways = async (req, res) => {
    try {
        const [gateways] = await db.execute(
            'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM gateways WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json(gateways);
    } catch (error) {
        console.error('Error fetching gateways:', error);
        res.status(500).json({ message: 'Failed to fetch gateways' });
    }
};

//get all Gateways for admin
export const getAllGateways = async (req, res) => {
    try {
        const [gateways] = await db.execute(
            'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM gateways ORDER BY created_at DESC'
        );

        res.json(gateways);
    } catch (error) {
        console.error('Error fetching gateways:', error);
        res.status(500).json({ message: 'Failed to fetch gateways' });
    }
};

// Get single Gateway
export const getGatewayById = async (req, res) => {
    try {
        const [gateways] = await db.execute(
            'SELECT id, name, serial_number, description, location, location_lat, location_lng, status, created_at FROM gateways WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (gateways.length === 0) {
            return res.status(404).json({ message: 'Gateway not found' });
        }

        res.json(gateways[0]);
    } catch (error) {
        console.error('Error fetching Gateway:', error);
        res.status(500).json({ message: 'Failed to fetch Gateway' });
    }
};

export const getGatewaysData = async (req, res) => {
    try {
        // 1️⃣ Get gateway
        const [gateways] = await db.execute(
            `SELECT id, name, serial_number, description, location,
              location_lat, location_lng, status, created_at
       FROM gateways
       WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (gateways.length === 0) {
            return res.status(404).json({ message: 'Gateway not found' });
        }

        // 2️⃣ Get sensors for this gateway
        const [sensors] = await db.execute(
            `SELECT id, name, serial_number, description, location,
              location_lat, location_lng, status, created_at
       FROM sensors
       WHERE gateway_id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        // 3️⃣ Combine data properly
        res.json({
            gateway: gateways[0],
            sensors,
        });

    } catch (error) {
        console.error('Error fetching Gateway Data:', error);
        res.status(500).json({ message: 'Failed to fetch Gateway Data' });
    }
};
