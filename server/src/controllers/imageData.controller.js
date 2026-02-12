import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import pool from '../config/database.js';

const OUTPUT_DIR = 'uploaded_images';

// Ensure upload directory exists
if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
}

const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const sanitizeBase64 = (base64) => {
    return base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
};

export const processImageData = async (req, res) => {
    const { serial_number, counts, time_taken, base64 } = req.body;

    if (counts === undefined || typeof counts !== 'number' || !base64) {
        return res.status(400).json({
            message: 'Invalid request. Required: {counts: number, time_taken: string, base64: string}'
        });
    }

    const fileId = generateUniqueId();
    const fileName = `${fileId}.png`;
    const filePath = join(OUTPUT_DIR, fileName);

    try {
        const base64Data = sanitizeBase64(base64);
        const imageBuffer = Buffer.from(base64Data, 'base64');
        writeFileSync(filePath, imageBuffer);

        // Check if sensor_id is registered in sensors table
        const [sensorRows] = await pool.execute(
            'SELECT id FROM sensors WHERE serial_number = ?',
            [serial_number]
        );

        if (sensorRows.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Sensor ID not registered'
            });
        }

         const sensorId = sensorRows[0].id;

        // Insert into fruitfly_images table
        const [result] = await pool.execute(
            'INSERT INTO fruitfly_images (sensor_id, image_path, analysis_status, time_captured) VALUES (?, ?, ?, ?)',
            [sensorId, filePath, 'pending', time_taken]
        );


       // Update image_id in fruitfly_counts table
        await pool.execute(
            'UPDATE fruitfly_counts SET image_id = ? WHERE sensor_id = ? AND time_taken = ? AND fruitfly_count = ?',
            [result.insertId, sensorId, time_taken, counts]
        );

       res.status(201).json({
            status: true,
            id: result.insertId,
            message: 'Data processed successfully',
            filename: fileName,
            path: filePath,
            counts: counts,
            timestamp: time_taken || new Date().toISOString()
        });

    } catch (error) {
        console.error('Processing image error:', error);
        res.status(500).json({
            message: 'Failed to process image data',
            error: error.message
        });
    }
};


