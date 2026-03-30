import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { validationResult } from 'express-validator';
import { logAuditEvent } from '../services/audit.service.js';

// Register new user
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'manager']
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertId, 
        username, 
        email, 
        role: 'manager',
        manager_user_id: null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    await logAuditEvent(pool, {
      actorUserId: result.insertId,
      action: 'auth.register',
      entityType: 'auth',
      entityId: result.insertId,
      details: {
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null,
        registered_email: email,
        registered_role: 'manager'
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: 'manager',
        manager_user_id: null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, username, email, password, role, manager_user_id, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await logAuditEvent(pool, {
        actorUserId: null,
        action: 'auth.login.failed',
        entityType: 'auth',
        entityId: email,
        details: {
          email,
          reason: 'user_not_found',
          ip_address: req.ip,
          user_agent: req.get('user-agent') ?? null
        }
      });
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logAuditEvent(pool, {
        actorUserId: user.id,
        action: 'auth.login.failed',
        entityType: 'auth',
        entityId: user.id,
        details: {
          email,
          reason: 'invalid_password',
          ip_address: req.ip,
          user_agent: req.get('user-agent') ?? null
        }
      });
      return res.status(401).json({ 
        message: 'Invalid email or password.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        manager_user_id: user.manager_user_id,
        created_at: user.created_at
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    await logAuditEvent(pool, {
      actorUserId: user.id,
      action: 'auth.login.success',
      entityType: 'auth',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null
      }
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        manager_user_id: user.manager_user_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const authMe = (req, res) => {
  res.json({ user: req.user });
};

export const logout = async (req, res) => {
  try {
    await logAuditEvent(pool, {
      actorUserId: req.user?.id ?? null,
      action: 'auth.logout',
      entityType: 'auth',
      entityId: req.user?.id ?? null,
      details: {
        role: req.user?.role ?? null,
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null
      }
    });

    res.json({ message: 'Logout recorded' });
  } catch (error) {
    console.error('Logout audit error:', error);
    res.status(500).json({ message: 'Failed to record logout' });
  }
};
