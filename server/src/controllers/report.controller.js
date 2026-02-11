import pool from '../config/database.js';
import { validationResult } from 'express-validator';
import { jsPDF } from 'jspdf';

const buildReportData = async ({ userId, reportType, dateStart, dateEnd }) => {
  const params = [userId];
  const [sensorRows] = await pool.execute(
    `
      SELECT s.id, s.name, s.location, s.status, s.gateway_id
      FROM sensors s
      WHERE s.user_id = ?
      ORDER BY s.name ASC
    `,
    params
  );

  const [gatewayRows] = await pool.execute(
    `
      SELECT g.id, g.name, g.location, g.status
      FROM gateways g
      WHERE g.user_id = ?
      ORDER BY g.name ASC
    `,
    [userId]
  );

  const [envRows] = await pool.execute(
    `
      SELECT s.id AS sensor_id,
             COUNT(er.id) AS readings,
             AVG(er.temperature) AS avg_temp,
             MIN(er.temperature) AS min_temp,
             MAX(er.temperature) AS max_temp,
             AVG(er.humidity) AS avg_humidity,
             MIN(er.humidity) AS min_humidity,
             MAX(er.humidity) AS max_humidity
      FROM sensors s
      LEFT JOIN environmental_readings er
        ON er.sensor_id = s.id
       AND DATE(er.created_at) BETWEEN ? AND ?
      WHERE s.user_id = ?
      GROUP BY s.id
    `,
    [dateStart, dateEnd, userId]
  );

  const [flyRows] = await pool.execute(
    `
      SELECT s.id AS sensor_id,
             COUNT(fc.id) AS samples,
             COALESCE(SUM(fc.fruitfly_count), 0) AS total_flies,
             AVG(fc.fruitfly_count) AS avg_flies,
             MAX(fc.fruitfly_count) AS max_flies
      FROM sensors s
      LEFT JOIN fruitfly_counts fc
        ON fc.sensor_id = s.id
       AND DATE(fc.created_at) BETWEEN ? AND ?
      WHERE s.user_id = ?
      GROUP BY s.id
    `,
    [dateStart, dateEnd, userId]
  );

  const envBySensor = Object.fromEntries(envRows.map(row => [row.sensor_id, row]));
  const flyBySensor = Object.fromEntries(flyRows.map(row => [row.sensor_id, row]));

  const sensorMetrics = sensorRows.map(sensor => ({
    sensor_id: sensor.id,
    name: sensor.name,
    location: sensor.location,
    status: sensor.status,
    gateway_id: sensor.gateway_id,
    readings: Number(envBySensor[sensor.id]?.readings ?? 0),
    avg_temp: envBySensor[sensor.id]?.avg_temp ?? null,
    min_temp: envBySensor[sensor.id]?.min_temp ?? null,
    max_temp: envBySensor[sensor.id]?.max_temp ?? null,
    avg_humidity: envBySensor[sensor.id]?.avg_humidity ?? null,
    min_humidity: envBySensor[sensor.id]?.min_humidity ?? null,
    max_humidity: envBySensor[sensor.id]?.max_humidity ?? null,
    fruitfly_samples: Number(flyBySensor[sensor.id]?.samples ?? 0),
    fruitfly_total: Number(flyBySensor[sensor.id]?.total_flies ?? 0),
    fruitfly_avg: flyBySensor[sensor.id]?.avg_flies ?? null,
    fruitfly_max: flyBySensor[sensor.id]?.max_flies ?? null
  }));

  const summary = {
    date_range_start: dateStart,
    date_range_end: dateEnd,
    sensors_total: sensorRows.length,
    sensors_active: sensorRows.filter(s => s.status === 'active').length,
    sensors_inactive: sensorRows.filter(s => s.status !== 'active').length,
    gateways_total: gatewayRows.length,
    gateways_online: gatewayRows.filter(g => g.status === 'online').length,
    gateways_offline: gatewayRows.filter(g => g.status === 'offline').length,
    gateways_maintenance: gatewayRows.filter(g => g.status === 'maintenance').length
  };

  if (reportType === 'summary') {
    const topSensors = [...sensorMetrics]
      .sort((a, b) => (b.fruitfly_total || 0) - (a.fruitfly_total || 0))
      .slice(0, 5);
    return { summary, top_sensors: topSensors };
  }

  if (reportType === 'analytics') {
    return { summary, sensors: sensorMetrics };
  }

  return { summary };
};

// Get all reports for user
export const getReports = async (req, res) => {
  try {
    const [reports] = await pool.execute(
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

    const { report_type, date_range_start, date_range_end } = req.body;

    const start = new Date(date_range_start);
    const end = new Date(date_range_end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const reportData = await buildReportData({
      userId: req.user.id,
      reportType: report_type,
      dateStart: date_range_start,
      dateEnd: date_range_end
    });

    const fileName = `report_${Date.now()}_${report_type}.pdf`;
    const filePath = `/reports/${req.user.id}/${fileName}`;

    const [result] = await pool.execute(
      'INSERT INTO reports (user_id, report_type, date_range_start, date_range_end, file_path) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, report_type, date_range_start, date_range_end, filePath]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Report generated successfully',
      file_path: filePath,
      report: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Download report
export const downloadReport = async (req, res) => {
  try {
    const [reports] = await pool.execute(
      'SELECT * FROM reports WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const report = reports[0];
    const reportData = await buildReportData({
      userId: req.user.id,
      reportType: report.report_type,
      dateStart: report.date_range_start,
      dateEnd: report.date_range_end
    });

    const format = String(req.query.format || 'json').toLowerCase();
    const baseName = `fruitfly_report_${report.id}_${report.report_type}`;

    if (format === 'csv') {
      const summaryLines = Object.entries(reportData.summary ?? {}).map(
        ([key, value]) => `${key},${value ?? ''}`
      );

      let sensorLines = [];
      if (reportData.sensors && reportData.sensors.length) {
        const headers = [
          'sensor_id',
          'name',
          'location',
          'status',
          'gateway_id',
          'readings',
          'avg_temp',
          'min_temp',
          'max_temp',
          'avg_humidity',
          'min_humidity',
          'max_humidity',
          'fruitfly_samples',
          'fruitfly_total',
          'fruitfly_avg',
          'fruitfly_max'
        ];

        sensorLines = [
          headers.join(','),
          ...reportData.sensors.map((row) =>
            headers.map((h) => {
              const value = row[h];
              if (value === null || value === undefined) return '';
              const safe = String(value).replace(/"/g, '""');
              return safe.includes(',') ? `"${safe}"` : safe;
            }).join(',')
          )
        ];
      }

      const csv = [
        'summary',
        ...summaryLines,
        '',
        'sensors',
        ...sensorLines
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
      res.send(csv);
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const lineHeight = 14;
      let y = margin;

      const addPageIfNeeded = (extra = lineHeight) => {
        if (y + extra > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const drawSectionTitle = (title) => {
        addPageIfNeeded(24);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += 8;
        doc.setDrawColor(180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;
        doc.setFont('helvetica', 'normal');
      };

      const formatDateShort = (value) => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value ?? '');
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };
      const formatNumber2 = (value) => {
        if (value === null || value === undefined || value === '') return 'N/A';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return num.toFixed(2);
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('FruitFly Farm Report', margin, y);
      y += 22;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report ID: ${report.id}`, margin, y);
      y += lineHeight;
      doc.text(`Type: ${report.report_type}`, margin, y);
      y += lineHeight;
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(margin, y - 6, 260, 32, 6, 6, 'FD');
      doc.setTextColor(30, 64, 175);
      doc.text('Range', margin + 8, y + 6);
      doc.text(
        `${formatDateShort(report.date_range_start)} → ${formatDateShort(report.date_range_end)}`,
        margin + 8,
        y + 18
      );
      doc.setTextColor(0, 0, 0);
      y += lineHeight * 5.6;

      drawSectionTitle('Summary');
      const summary = reportData.summary ?? {};
      const summaryEntries = Object.entries(summary);
      const summaryRowHeight = 20;
      const labelWidth = 220;
      const valueWidth = pageWidth - margin * 2 - labelWidth;

      const drawSummaryRow = (label, value, isHeader = false, isStriped = false) => {
        addPageIfNeeded(summaryRowHeight + 8);
        if (isHeader) {
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, y, labelWidth, summaryRowHeight, 'F');
          doc.rect(margin + labelWidth, y, valueWidth, summaryRowHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin + 6, y + 14);
          doc.text(value, margin + labelWidth + 6, y + 14);
        } else {
          doc.setFillColor(isStriped ? 250 : 255, isStriped ? 252 : 255, isStriped ? 255 : 255);
          doc.rect(margin, y, labelWidth, summaryRowHeight, 'F');
          doc.rect(margin + labelWidth, y, valueWidth, summaryRowHeight, 'F');
          doc.setDrawColor(220);
          doc.rect(margin, y, labelWidth, summaryRowHeight);
          doc.rect(margin + labelWidth, y, valueWidth, summaryRowHeight);
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin + 6, y + 14);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value), margin + labelWidth + 6, y + 14);
        }
        y += summaryRowHeight;
      };

      drawSummaryRow('Metric', 'Value', true, false);
      summaryEntries.forEach((entry, index) => {
        const [key, value] = entry;
        const label = key.replace(/_/g, ' ');
        const displayValue = key.includes('date_range')
          ? formatDateShort(value)
          : (value ?? 'N/A');
        drawSummaryRow(label, String(displayValue), false, index % 2 === 0);
      });
      y += 50;

      if (reportData.sensors && reportData.sensors.length) {
        y += 26;
        drawSectionTitle('Sensors');

        if (report.report_type === 'analytics') {
          const rowHeight = 20;
          const labelWidth = 180;
          const valueWidth = pageWidth - margin * 2 - labelWidth;

          const drawSensorTable = (sensor) => {
            const rows = [
              ['Location', sensor.location ?? 'N/A'],
              ['Status', sensor.status ?? 'N/A'],
              ['Gateway', sensor.gateway_id ?? 'N/A'],
              [
                'Temp avg/min/max',
                `${formatNumber2(sensor.avg_temp)} / ${formatNumber2(sensor.min_temp)} / ${formatNumber2(sensor.max_temp)}`
              ],
              [
                'Humidity avg/min/max',
                `${formatNumber2(sensor.avg_humidity)} / ${formatNumber2(sensor.min_humidity)} / ${formatNumber2(sensor.max_humidity)}`
              ],
              [
                'Fruitfly total/avg/max',
                `${sensor.fruitfly_total ?? 0} / ${formatNumber2(sensor.fruitfly_avg)} / ${formatNumber2(sensor.fruitfly_max)}`
              ],
              ['Readings', `${sensor.readings ?? 0}`],
              ['Samples', `${sensor.fruitfly_samples ?? 0}`]
            ];

            const tableHeight = rows.length * rowHeight + 16;
            addPageIfNeeded(tableHeight + 48);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`#${sensor.sensor_id} ${sensor.name}`, margin, y);
            y += 12;

            const startY = y;
            doc.setDrawColor(210);
            doc.setFillColor(245, 247, 250);
            doc.rect(margin, startY, labelWidth, rowHeight, 'F');
            doc.rect(margin + labelWidth, startY, valueWidth, rowHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('Metric', margin + 6, startY + 14);
            doc.text('Value', margin + labelWidth + 6, startY + 14);

            y = startY + rowHeight;
            doc.setFont('helvetica', 'normal');
            rows.forEach(([label, value], index) => {
              doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
              doc.rect(margin, y, labelWidth, rowHeight, 'F');
              doc.rect(margin + labelWidth, y, valueWidth, rowHeight, 'F');
              doc.setDrawColor(220);
              doc.rect(margin, y, labelWidth, rowHeight);
              doc.rect(margin + labelWidth, y, valueWidth, rowHeight);
              doc.text(String(label), margin + 6, y + 14);
              doc.text(String(value), margin + labelWidth + 6, y + 14);
              y += rowHeight;
            });

            y += 26;
          };

          reportData.sensors.forEach(drawSensorTable);
        } else {
          const headers = ['Sensor', 'Status', 'Avg Temp', 'Avg Hum', 'Flies Total'];
          const colWidths = [180, 70, 80, 80, 90];
          const startX = margin;

          const drawRow = (cells, bold = false) => {
            addPageIfNeeded(lineHeight + 6);
            let x = startX;
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            cells.forEach((cell, idx) => {
              doc.text(String(cell), x, y);
              x += colWidths[idx];
            });
            y += lineHeight;
          };

          drawRow(headers, true);
          doc.setDrawColor(200);
          doc.line(margin, y - 6, pageWidth - margin, y - 6);

          reportData.sensors.forEach((sensor) => {
            drawRow([
              `#${sensor.sensor_id} ${sensor.name}`,
              sensor.status ?? 'N/A',
              sensor.avg_temp ?? 'N/A',
              sensor.avg_humidity ?? 'N/A',
              sensor.fruitfly_total ?? 0
            ]);
          });
        }
      }

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    res.json({
      message: 'Report ready',
      report,
      data: reportData
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Failed to download report' });
  }
};

export const getReportAvailability = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
        SELECT
          MIN(dates.min_date) AS min_date,
          MAX(dates.max_date) AS max_date
        FROM (
          SELECT MIN(er.created_at) AS min_date, MAX(er.created_at) AS max_date
          FROM environmental_readings er
          JOIN sensors s ON s.id = er.sensor_id
          WHERE s.user_id = ?
          UNION ALL
          SELECT MIN(fc.created_at) AS min_date, MAX(fc.created_at) AS max_date
          FROM fruitfly_counts fc
          JOIN sensors s ON s.id = fc.sensor_id
          WHERE s.user_id = ?
        ) AS dates
      `,
      [req.user.id, req.user.id]
    );

    const minDate = rows?.[0]?.min_date ?? null;
    const maxDate = rows?.[0]?.max_date ?? null;

    res.json({
      min_date: minDate,
      max_date: maxDate
    });
  } catch (error) {
    console.error('Error fetching report availability:', error);
    res.status(500).json({ message: 'Failed to fetch report availability' });
  }
};
