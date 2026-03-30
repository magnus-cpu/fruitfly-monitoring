import pool from '../config/database.js';
import { logAuditEvent } from '../services/audit.service.js';

export const getContent = async (req, res) => {
  try {
    const page = req.query.page ? String(req.query.page) : null;
    const pages = req.query.pages ? String(req.query.pages).split(',') : null;

    let query = `
      SELECT id, page_key, section_key, title, body, style, order_index, updated_at
      FROM content_blocks
    `;
    const params = [];

    if (page) {
      query += ' WHERE page_key = ?';
      params.push(page);
    } else if (pages && pages.length) {
      query += ` WHERE page_key IN (${pages.map(() => '?').join(',')})`;
      params.push(...pages);
    }

    query += ' ORDER BY page_key ASC, order_index ASC, id ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching content blocks:', error);
    res.status(500).json({ message: 'Failed to fetch content blocks' });
  }
};

export const upsertContent = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { page_key, section_key, title, body, style, order_index } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `
        INSERT INTO content_blocks (page_key, section_key, title, body, style, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          body = VALUES(body),
          style = VALUES(style),
          order_index = VALUES(order_index)
      `,
      [
        page_key,
        section_key,
        title,
        body,
        style ?? 'card',
        Number.isFinite(Number(order_index)) ? Number(order_index) : 0
      ]
    );

    const [rows] = await connection.execute(
      `
        SELECT id, page_key, section_key, title, style, order_index
        FROM content_blocks
        WHERE page_key = ? AND section_key = ?
        LIMIT 1
      `,
      [page_key, section_key]
    );
    const block = rows[0];

    await logAuditEvent(connection, {
      actorUserId: req.user?.id ?? null,
      action: 'content.upsert',
      entityType: 'content_block',
      entityId: block?.id ?? result.insertId,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        page_key,
        section_key,
        title,
        style: style ?? 'card',
        order_index: Number.isFinite(Number(order_index)) ? Number(order_index) : 0
      }
    });

    await connection.commit();

    res.status(200).json({
      message: 'Content saved',
      insertId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving content block:', error);
    res.status(500).json({ message: 'Failed to save content block' });
  } finally {
    connection.release();
  }
};

export const deleteContent = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
        SELECT id, page_key, section_key, title, style, order_index
        FROM content_blocks
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Content block not found' });
    }

    const block = rows[0];

    const [result] = await connection.execute(
      'DELETE FROM content_blocks WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Content block not found' });
    }

    await logAuditEvent(connection, {
      actorUserId: req.user?.id ?? null,
      action: 'content.delete',
      entityType: 'content_block',
      entityId: block.id,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        page_key: block.page_key,
        section_key: block.section_key,
        title: block.title,
        style: block.style,
        order_index: block.order_index
      }
    });

    await connection.commit();

    res.json({ message: 'Content block deleted' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting content block:', error);
    res.status(500).json({ message: 'Failed to delete content block' });
  } finally {
    connection.release();
  }
};
