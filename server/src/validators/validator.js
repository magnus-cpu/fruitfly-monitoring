import { body, param, query } from 'express-validator';

/* ---------------- Common helpers ---------------- */
const usernameChain = () =>
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores');

const emailChain = () =>
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required');

const passwordChain = (field = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage(`${field} must be ≥ 6 characters`)
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage(`${field} must contain both letters and numbers`);

const roleChain = () =>
  body('role')
    .isIn(['user', 'admin'])
    .withMessage("Role must be either 'user' or 'admin'");

const idChain = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);

/* ---------------- User routes ---------------- */
export const validateRegister = [
  usernameChain(),
  emailChain(),
  passwordChain()
];

export const validateLogin = [
  emailChain(),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateUpdateProfile = [
  usernameChain().optional(),
  emailChain().optional()
];

export const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  passwordChain('newPassword')
];

export const validateUpdateUserRole = [roleChain()];

export const validateUserId = [idChain()];
export const validateContentId = [idChain()];

/* ---------------- Sensor routes (bonus) ---------------- */
export const validateSensor = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Sensor name is required (max 100 chars)'),
  body('location_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

export const validateSensorData = [
  body('sensor_id').isInt({ min: 1 }).withMessage('Valid sensor ID required'),
  body('temperature').optional().isFloat().withMessage('Temperature must be a number'),
  body('humidity').optional().isFloat().withMessage('Humidity must be a number')
];

/* ---------------- Report routes (bonus) ---------------- */
export const validateReport = [
  body('report_type')
    .isIn(['summary', 'analytics'])
    .withMessage('Invalid report type'),
  body('date_range_start').isISO8601().withMessage('Valid start date required'),
  body('date_range_end').isISO8601().withMessage('Valid end date required')
];

/* ---------------- Content routes ---------------- */
export const validateContentBlock = [
  body('page_key').isLength({ min: 2, max: 50 }).withMessage('page_key is required'),
  body('section_key').isLength({ min: 2, max: 50 }).withMessage('section_key is required'),
  body('title').isLength({ min: 2, max: 120 }).withMessage('title is required'),
  body('body').isLength({ min: 5, max: 5000 }).withMessage('body is required'),
  body('style').optional().isIn(['card', 'accordion']).withMessage('Invalid style'),
  body('order_index').optional().isInt({ min: 0 }).withMessage('order_index must be >= 0')
];
