import pool from '../config/database.js';
import { parseAuditDetails } from '../services/audit.service.js';

export const getAuditLogs = async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit);
    const parsedPage = Number(req.query.page);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.trunc(parsedLimit), 200)
      : 50;
    const page = Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.trunc(parsedPage)
      : 1;
    const offset = (page - 1) * limit;

    const filters = [];
    const params = [];

    if (req.query.action) {
      filters.push('al.action = ?');
      params.push(String(req.query.action));
    }

    if (req.query.entity_type) {
      filters.push('al.entity_type = ?');
      params.push(String(req.query.entity_type));
    }

    if (req.query.actor_user_id) {
      filters.push('al.actor_user_id = ?');
      params.push(Number(req.query.actor_user_id));
    }

    if (req.query.search) {
      filters.push('(al.action LIKE ? OR al.entity_type LIKE ? OR al.entity_id LIKE ? OR u.username LIKE ? OR al.details LIKE ?)');
      const term = `%${String(req.query.search)}%`;
      params.push(term, term, term, term, term);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        ${whereClause}
      `,
      params
    );

    const [rows] = await pool.execute(
      `
        SELECT
          al.id,
          al.actor_user_id,
          u.username AS actor_username,
          u.email AS actor_email,
          al.action,
          al.entity_type,
          al.entity_id,
          al.details,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        ${whereClause}
        ORDER BY al.created_at DESC, al.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    res.json({
      page,
      limit,
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({
        ...row,
        details: parseAuditDetails(row.details)
      }))
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

export const deleteAuditLog = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM audit_logs WHERE id = ?',
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({ message: 'Audit log deleted' });
  } catch (error) {
    console.error('Error deleting audit log:', error);
    res.status(500).json({ message: 'Failed to delete audit log' });
  }
};

export const clearAuditLogs = async (req, res) => {
  try {
    const beforeDays = Number(req.query.before_days);
    let result;

    if (Number.isFinite(beforeDays) && beforeDays > 0) {
      [result] = await pool.execute(
        `
          DELETE FROM audit_logs
          WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `,
        [Math.trunc(beforeDays)]
      );
    } else {
      [result] = await pool.execute('DELETE FROM audit_logs');
    }

    res.json({
      message: 'Audit logs cleared',
      deleted_count: result.affectedRows ?? 0
    });
  } catch (error) {
    console.error('Error clearing audit logs:', error);
    res.status(500).json({ message: 'Failed to clear audit logs' });
  }
};
