-- Database creation and selection
CREATE DATABASE IF NOT EXISTS fruitfly_monitoring_db;
USE fruitfly_monitoring_db;

-- 1. USERS Table
-- Stores user information, including authentication details.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. GATEWAYS Table
-- The central communication hub. Linked to a user and has location data.
CREATE TABLE IF NOT EXISTS gateways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE, 
    description TEXT,
    location VARCHAR(100), -- Physical location where the gateway is installed
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    user_id INT, -- Foreign key linking the gateway to its owning user
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'online',
    last_seen_at TIMESTAMP NULL, -- Track the last time the gateway reported in
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL -- Set to NULL if user is deleted
);

-- 3. SENSORS Table
-- The sensing nodes. Each sensor must be linked to one gateway (mandatory).
CREATE TABLE IF NOT EXISTS sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    user_id INT,
    gateway_id INT NOT NULL, -- MANDATORY link to the gateway
    status ENUM('active', 'inactive', 'error') DEFAULT 'active', -- Added 'error' for better monitoring
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE  
);

-- 4A. ENVIRONMENTAL_READINGS Table
-- Stores general environmental data like temperature and humidity.
CREATE TABLE IF NOT EXISTS environmental_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    time_taken TIMESTAMP, -- When the reading was taken
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

-- 4B. FRUITFLY_IMAGES Table
-- Stores metadata about the image captured for fruit fly counting (the source data).
CREATE TABLE IF NOT EXISTS fruitfly_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL, -- Path or URL to the stored image file (e.g., in a cloud bucket)
    analysis_status ENUM('pending', 'analyzed', 'failed') DEFAULT 'pending',
    time_captured TIMESTAMP, -- When the image was captured
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

-- 4C. FRUITFLY_COUNTS Table
-- Stores the fruit fly specific monitoring data, linked to the source image.
CREATE TABLE IF NOT EXISTS fruitfly_counts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    image_id INT NULL, -- NEW: Foreign key linking to the fruitfly_images table (4B)
    fruitfly_count INT DEFAULT 0,
    time_taken TIMESTAMP, -- When the count was recorded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES fruitfly_images(id) ON DELETE SET NULL -- Ensure link is maintained
);

-- 4D. SYSTEM_TELEMETRY Table (UPDATED FOR GATEWAY AND SENSOR)
-- Stores diagnostic and operational data for both Gateways and Sensor Nodes.
CREATE TABLE IF NOT EXISTS system_telemetry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_id INT NULL,  -- ID of the reporting Gateway (NULL if reported by a Sensor)
    sensor_id INT NULL,   -- ID of the reporting Sensor Node (NULL if reported by the Gateway)
    
    voltage DECIMAL(5,2),   -- Battery/power supply voltage
    current DECIMAL(5,2),    -- Current draw
    power DECIMAL(7,2),      -- Power consumption in Watts
    signal_strength INT,    -- Network signal strength (Gateway) or Link Quality (Sensor)
    cpu_temp DECIMAL(5,2),  -- CPU temperature (more likely on Gateway)
    
    time_taken TIMESTAMP,   -- When the telemetry data was recorded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
    -- NOTE: Ideally, a constraint would ensure that exactly one of gateway_id or sensor_id is NOT NULL.
);

-- 5. REPORTS Table
-- Stores metadata about generated reports, such as PDF paths or summary types.
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(50),
    date_range_start DATE,
    date_range_end DATE,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);