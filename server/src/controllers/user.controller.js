import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

/* ---------------- Self-service ---------------- */

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
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
    res.json({ message: 'Profile updated' });
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
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.id;          // ←  no longer req.params.id
    await User.destroy({ where: { id: userId } });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---------------- Admin ---------------- */

export const getAllUsers = async (_req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUserAny = async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { role } = req.body;
  try {
    const [result] = await pool.execute('UPDATE users SET role = ? WHERE id = ?', [
      role,
      req.params.id
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};