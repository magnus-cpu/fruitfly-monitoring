import db from '../config/database.js';

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

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching content blocks:', error);
    res.status(500).json({ message: 'Failed to fetch content blocks' });
  }
};

export const upsertContent = async (req, res) => {
  try {
    const { page_key, section_key, title, body, style, order_index } = req.body;

    const [result] = await db.execute(
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

    res.status(200).json({
      message: 'Content saved',
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Error saving content block:', error);
    res.status(500).json({ message: 'Failed to save content block' });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM content_blocks WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Content block not found' });
    }

    res.json({ message: 'Content block deleted' });
  } catch (error) {
    console.error('Error deleting content block:', error);
    res.status(500).json({ message: 'Failed to delete content block' });
  }
};
