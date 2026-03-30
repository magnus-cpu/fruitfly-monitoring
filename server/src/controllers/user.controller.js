import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { logAuditEvent } from '../services/audit.service.js';

/* ---------------- Self-service ---------------- */

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, manager_user_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email } = req.body;
  try {
    // Prevent duplicate username/email
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, req.user.id]
    );
    if (rows.length)
      return res.status(409).json({ message: 'Username or email already taken' });

    await pool.execute(
      'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?',
      [username, email, req.user.id]
    );

    await logAuditEvent(pool, {
      actorUserId: req.user.id,
      action: 'profile.update',
      entityType: 'user',
      entityId: req.user.id,
      details: {
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null,
        username,
        email
      }
    });

    const [updatedUsers] = await pool.execute(
      'SELECT id, username, email, role, manager_user_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updatedUsers[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  try {
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    await logAuditEvent(pool, {
      actorUserId: req.user.id,
      action: 'profile.password.change',
      entityType: 'user',
      entityId: req.user.id,
      details: {
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null
      }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteUser = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;

    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (!users.length) {
      await connection.rollback();
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = users[0];

    await logAuditEvent(connection, {
      actorUserId: userId,
      action: 'account.delete.self',
      entityType: 'user',
      entityId: userId,
      details: {
        actor_username: req.user?.username ?? user.username,
        actor_role: req.user?.role ?? user.role,
        ip_address: req.ip,
        target_username: user.username,
        target_email: user.email
      }
    });

    await connection.execute('DELETE FROM users WHERE manager_user_id = ?', [userId]);
    await connection.execute('DELETE FROM gateways WHERE user_id = ?', [userId]);
    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

    if (!result.affectedRows) {
      await connection.rollback();
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await connection.commit();
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `
        SELECT id, username, email, role, manager_user_id, created_at
        FROM users
        WHERE manager_user_id = ? AND role = 'viewer'
        ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTeamMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'User with this email or username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await connection.execute(
      `
        INSERT INTO users (username, email, password, role, manager_user_id)
        VALUES (?, ?, ?, 'viewer', ?)
      `,
      [username, email, hashedPassword, req.user.id]
    );

    await logAuditEvent(connection, {
      actorUserId: req.user.id,
      action: 'team_member.create',
      entityType: 'user',
      entityId: result.insertId,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        created_username: username,
        created_email: email,
        created_role: 'viewer'
      }
    });

    await connection.commit();

    res.status(201).json({
      message: 'Viewer account created successfully',
      user: {
        id: result.insertId,
        username,
        email,
        role: 'viewer',
        manager_user_id: req.user.id
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

export const deleteTeamMember = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      `
        SELECT id, username, email, role, manager_user_id
        FROM users
        WHERE id = ? AND manager_user_id = ? AND role = 'viewer'
      `,
      [req.params.id, req.user.id]
    );

    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Viewer account not found' });
    }

    const targetUser = users[0];

    await logAuditEvent(connection, {
      actorUserId: req.user.id,
      action: 'team_member.delete',
      entityType: 'user',
      entityId: targetUser.id,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        target_username: targetUser.username,
        target_email: targetUser.email,
        target_role: targetUser.role
      }
    });

    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: 'Viewer account not found' });
    }

    await connection.commit();
    res.json({ message: 'Viewer account deleted' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

/* ---------------- Admin ---------------- */

export const getAllUsers = async (_req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, manager_user_id, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUserAny = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = users[0];

    await logAuditEvent(connection, {
      actorUserId: req.user?.id ?? null,
      action: 'account.delete.admin',
      entityType: 'user',
      entityId: req.params.id,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        target_username: targetUser.username,
        target_email: targetUser.email,
        target_role: targetUser.role
      }
    });

    await connection.execute('DELETE FROM users WHERE manager_user_id = ?', [req.params.id]);
    await connection.execute('DELETE FROM gateways WHERE user_id = ?', [req.params.id]);
    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    await connection.commit();

    res.json({ message: 'User deleted' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

export const updateUserRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { role } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT id, username, role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = users[0];

    const [result] = await connection.execute('UPDATE users SET role = ? WHERE id = ?', [
      role,
      req.params.id
    ]);
    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    await logAuditEvent(connection, {
      actorUserId: req.user?.id ?? null,
      action: 'user.role.update',
      entityType: 'user',
      entityId: req.params.id,
      details: {
        actor_username: req.user?.username ?? null,
        actor_role: req.user?.role ?? null,
        ip_address: req.ip,
        target_username: targetUser.username,
        previous_role: targetUser.role,
        new_role: role
      }
    });

    await connection.commit();

    res.json({ message: 'Role updated' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};
