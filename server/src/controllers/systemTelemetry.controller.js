import pool from '../config/database.js';

const REFERENCE_VOLTAGE = 5;

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const roundTo2 = (value) => Number(value.toFixed(2));

const parseTelemetryEntry = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Each telemetry entry must be an object.' };
  }

  const gatewaySerial = raw.gateway_serial_number || null;
  const sensorSerial = raw.sensor_serial_number || null;

  if (!gatewaySerial && !sensorSerial) {
    return { error: 'Provide gateway_serial_number or sensor_serial_number.' };
  }

  if (gatewaySerial && sensorSerial) {
    return { error: 'Provide only one reporter: gateway or sensor.' };
  }

  let voltage = toNumberOrNull(raw.voltage);
  let current = toNumberOrNull(raw.current);
  let power = toNumberOrNull(raw.power);
  const signalStrength = toNumberOrNull(raw.signal_strength);
  const cpuTemp = toNumberOrNull(raw.cpu_temp);
  const timeTaken = raw.time_taken || null;

  if (voltage === null) voltage = REFERENCE_VOLTAGE;

  if (current === null && power !== null) current = power / voltage;
  if (power === null && current !== null) power = voltage * current;

  if (current === null || power === null) {
    return { error: 'Provide current or power so the other can be derived.' };
  }

  return {
    gatewaySerial,
    sensorSerial,
    voltage: roundTo2(voltage),
    current: roundTo2(current),
    power: roundTo2(power),
    signalStrength,
    cpuTemp,
    timeTaken
  };
};

const resolveGatewayId = async (serialNumber) => {
  const [rows] = await pool.execute(
    'SELECT id FROM gateways WHERE serial_number = ?',
    [serialNumber]
  );
  return rows.length ? rows[0].id : null;
};

const resolveSensorId = async (serialNumber) => {
  const [rows] = await pool.execute(
    'SELECT id FROM sensors WHERE serial_number = ?',
    [serialNumber]
  );
  return rows.length ? rows[0].id : null;
};

export const storeSystemTelemetry = async (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];

  if (!payload.length) {
    return res.status(400).json({
      status: false,
      message: 'Telemetry payload is empty.'
    });
  }

  try {
    const inserted = [];

    for (let index = 0; index < payload.length; index += 1) {
      const parsed = parseTelemetryEntry(payload[index]);

      if (parsed.error) {
        return res.status(400).json({
          status: false,
          message: parsed.error,
          entry_index: index
        });
      }

      let gatewayId = null;
      let sensorId = null;

      if (parsed.gatewaySerial) {
        gatewayId = await resolveGatewayId(parsed.gatewaySerial);
        if (!gatewayId) {
          return res.status(400).json({
            status: false,
            message: `Gateway serial number not registered: ${parsed.gatewaySerial}`,
            entry_index: index
          });
        }
      }

      if (parsed.sensorSerial) {
        sensorId = await resolveSensorId(parsed.sensorSerial);
        if (!sensorId) {
          return res.status(400).json({
            status: false,
            message: `Sensor serial number not registered: ${parsed.sensorSerial}`,
            entry_index: index
          });
        }
      }

      const [result] = await pool.execute(
        `INSERT INTO system_telemetry
          (gateway_id, sensor_id, voltage, current, power, signal_strength, cpu_temp, time_taken)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gatewayId,
          sensorId,
          parsed.voltage,
          parsed.current,
          parsed.power,
          parsed.signalStrength,
          parsed.cpuTemp,
          parsed.timeTaken
        ]
      );

      inserted.push({
        id: result.insertId,
        gateway_id: gatewayId,
        sensor_id: sensorId
      });
    }

    return res.status(201).json({
      status: true,
      message: 'System telemetry stored successfully.',
      inserted_count: inserted.length,
      rows: inserted
    });
  } catch (error) {
    console.error('Error storing system telemetry:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to store system telemetry.',
      error: error.message
    });
  }
};

export const getSystemTelemetry = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sensor_serial_number, gateway_serial_number } = req.query;
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.trunc(parsedLimit), 200)
      : 50;

    const filters = ['COALESCE(s.user_id, g.user_id) = ?'];
    const params = [userId];

    if (sensor_serial_number) {
      filters.push('s.serial_number = ?');
      params.push(sensor_serial_number);
    }

    if (gateway_serial_number) {
      filters.push('g.serial_number = ?');
      params.push(gateway_serial_number);
    }

    const [rows] = await pool.execute(
      `SELECT
        st.id,
        st.gateway_id,
        st.sensor_id,
        g.name AS gateway_name,
        g.serial_number AS gateway_serial_number,
        s.name AS sensor_name,
        s.serial_number AS sensor_serial_number,
        st.voltage,
        st.current,
        st.power,
        st.signal_strength,
        st.cpu_temp,
        st.time_taken,
        st.created_at
      FROM system_telemetry st
      LEFT JOIN gateways g ON g.id = st.gateway_id
      LEFT JOIN sensors s ON s.id = st.sensor_id
      WHERE ${filters.join(' AND ')}
      ORDER BY COALESCE(st.time_taken, st.created_at) DESC
      LIMIT ${limit}`,
      params
    );

    return res.json({
      status: true,
      count: rows.length,
      rows
    });
  } catch (error) {
    console.error('Error fetching system telemetry:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch system telemetry.',
      error: error.message
    });
  }
};
