import db from '../config/database.js';
import { validationResult } from 'express-validator';

// Get all reports for user
export const getReports = async (req, res) => {
  try {
    const [reports] = await db.execute(
      `SELECT id, report_type, date_range_start, date_range_end, file_path, created_at 
       FROM reports 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

// Generate new report
export const generateReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sensor_id, report_type, date_range_start, date_range_end } = req.body;

    // Here you would typically:
    // 1. Query the database for the relevant data
    const [data] = await db.execute(
      'SELECT * FROM sensor_data WHERE sensor_id = ? AND created_at BETWEEN created_at AND created_at ORDER BY created_at DESC',
      [sensor_id, date_range_start, date_range_end]
    );
    console.log(data);
    // res.json(data);
    // 2. Generate the report (PDF, Excel, etc.)
    // 3. Save the file to storage
    // 4. Update the database with file path

    // For now, we'll simulate report generation
    const fileName = `report_${Date.now()}_${report_type}.pdf`;
    const filePath = `/reports/${req.user.id}/${fileName}`;

    const [result] = await db.execute(
      'INSERT INTO reports (user_id, report_type, date_range_start, date_range_end, file_path) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, report_type, date_range_start, date_range_end, filePath]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Report generated successfully',
      file_path: filePath
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Download report
export const downloadReport = async (req, res) => {
  try {
    const [reports] = await db.execute(
      'SELECT * FROM reports WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const report = reports[0];

    // Here you would typically:
    // 1. Check if file exists
    // 2. Send file to client
    // For now, we'll simulate a download

    res.json({
      message: 'Report download initiated',
      file_path: report.file_path,
      download_url: `/api/reports/${report.id}/file`
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Failed to download report' });
  }
};