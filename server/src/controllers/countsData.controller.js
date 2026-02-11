import pool from '../config/database.js';

export const storeCountsData = async (req, res) => {
    const { serial_number, fruitfly_count, time_taken } = req.body;

    // GET sensor id from serial_number
    try {
        const [sensorRows] = await pool.execute
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

        // Insert into fruitfly_counts table  new data

        const [result] = await pool.execute(
            'INSERT INTO fruitfly_counts (sensor_id, fruitfly_count, time_taken) VALUES (?, ?, ?)',
            [sensorId, fruitfly_count, time_taken]
        );

        res.status(201).json({
            status: true,
            message: 'fruitfly counts data stored successfully'
        })
    } catch (error) {
        console.error('Processing fruitfly counts error:', error);
        res.status(500).json({
            message: 'Failed to process fruitfly counts data',
            error: error.message
        });
    }
};