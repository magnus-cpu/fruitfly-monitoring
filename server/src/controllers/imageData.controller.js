import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import pool from '../config/database.js';
import { getOwnerUserId } from '../services/access.service.js';
import { logAuditEvent } from '../services/audit.service.js';

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
    const { serial_number, fruitfly_count, time_taken, base64 } = req.body;

    if (fruitfly_count === undefined || typeof fruitfly_count !== 'number' || !base64) {
        return res.status(400).json({
            message: 'Invalid request. Required: {fruitfly_count: number, time_taken: string, base64: string}'
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
            [result.insertId, sensorId, time_taken, fruitfly_count]
        );

       res.status(201).json({
            status: true,
            id: result.insertId,
            message: 'Data processed successfully',
            filename: fileName,
            path: filePath,
            counts: fruitfly_count,
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

export const getFruitflyImages = async (req, res) => {
    try {
        const userId = getOwnerUserId(req.user);
        const { sensor_serial_number, analysis_status } = req.query;
        const parsedLimit = Number(req.query.limit);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(Math.trunc(parsedLimit), 200)
            : 50;

        const params = [userId];
        const conditions = ['s.user_id = ?'];

        if (sensor_serial_number) {
            conditions.push('s.serial_number = ?');
            params.push(sensor_serial_number);
        }

        if (analysis_status && ['pending', 'analyzed', 'failed'].includes(analysis_status)) {
            conditions.push('fi.analysis_status = ?');
            params.push(analysis_status);
        }

        const [rows] = await pool.execute(
            `SELECT
                fi.id,
                fi.sensor_id,
                s.name AS sensor_name,
                s.serial_number AS sensor_serial_number,
                fi.image_path,
                fi.analysis_status,
                fi.analysis_notes,
                fi.analyzed_at,
                fi.analyzed_by_user_id,
                fi.time_captured,
                fi.created_at,
                fc.fruitfly_count
            FROM fruitfly_images fi
            INNER JOIN sensors s ON s.id = fi.sensor_id
            LEFT JOIN fruitfly_counts fc ON fc.image_id = fi.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY COALESCE(fi.time_captured, fi.created_at) DESC
            LIMIT ${limit}`,
            params
        );

        const rowsWithUrl = rows.map((row) => ({
            ...row,
            image_url: `${req.protocol}://${req.get('host')}/uploads/${basename(row.image_path)}`
        }));

        res.json({
            status: true,
            count: rowsWithUrl.length,
            rows: rowsWithUrl
        });
    } catch (error) {
        console.error('Error fetching fruitfly images:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to fetch fruitfly images',
            error: error.message
        });
    }
};

export const updateFruitflyImageAnalysis = async (req, res) => {
    try {
        const userId = getOwnerUserId(req.user);
        const imageId = Number(req.params.id);
        const allowedStatuses = ['pending', 'analyzed', 'failed'];
        const requestedStatus = typeof req.body.analysis_status === 'string'
            ? req.body.analysis_status.trim().toLowerCase()
            : '';
        const analysisNotes = typeof req.body.analysis_notes === 'string'
            ? req.body.analysis_notes.trim().slice(0, 4000)
            : null;

        if (!Number.isInteger(imageId) || imageId <= 0) {
            return res.status(400).json({
                status: false,
                message: 'Invalid image id'
            });
        }

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                status: false,
                message: 'analysis_status must be pending, analyzed, or failed'
            });
        }

        const [rows] = await pool.execute(
            `SELECT fi.id
             FROM fruitfly_images fi
             INNER JOIN sensors s ON s.id = fi.sensor_id
             WHERE fi.id = ? AND s.user_id = ?`,
            [imageId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Image not found'
            });
        }

        const analyzedAt = requestedStatus === 'pending' ? null : new Date();
        const analyzedByUserId = requestedStatus === 'pending' ? null : req.user.id;

        await pool.execute(
            `UPDATE fruitfly_images
             SET analysis_status = ?, analysis_notes = ?, analyzed_at = ?, analyzed_by_user_id = ?
             WHERE id = ?`,
            [requestedStatus, analysisNotes, analyzedAt, analyzedByUserId, imageId]
        );

        await logAuditEvent(pool, {
            actorUserId: req.user.id,
            action: 'image.analyze',
            entityType: 'fruitfly_image',
            entityId: imageId,
            details: {
                analysis_status: requestedStatus,
                analysis_notes: analysisNotes
            }
        });

        res.json({
            status: true,
            message: 'Image analysis updated successfully'
        });
    } catch (error) {
        console.error('Error updating fruitfly image analysis:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to update image analysis',
            error: error.message
        });
    }
};

export const deleteFruitflyImage = async (req, res) => {
    try {
        const userId = getOwnerUserId(req.user);
        const imageId = Number(req.params.id);

        if (!Number.isInteger(imageId) || imageId <= 0) {
            return res.status(400).json({
                status: false,
                message: 'Invalid image id'
            });
        }

        const [rows] = await pool.execute(
            `SELECT fi.id, fi.image_path
             FROM fruitfly_images fi
             INNER JOIN sensors s ON s.id = fi.sensor_id
             WHERE fi.id = ? AND s.user_id = ?`,
            [imageId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Image not found'
            });
        }

        const image = rows[0];

        await pool.execute('DELETE FROM fruitfly_images WHERE id = ?', [imageId]);

        if (image.image_path && existsSync(image.image_path)) {
            unlinkSync(image.image_path);
        }

        await logAuditEvent(pool, {
            actorUserId: req.user.id,
            action: 'image.delete',
            entityType: 'fruitfly_image',
            entityId: imageId,
            details: {
                image_path: image.image_path
            }
        });

        res.json({
            status: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting fruitfly image:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to delete image',
            error: error.message
        });
    }
};
