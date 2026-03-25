-- =========================================
-- IIC Bus Management System - Database Setup
-- =========================================

CREATE DATABASE IF NOT EXISTS bus_management;
USE bus_management;

-- Drop tables in correct order (foreign keys first)
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS daily_shift_logs;
DROP TABLE IF EXISTS bus_registrations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS users;

-- ========== USERS TABLE ==========
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role ENUM('student','admin','driver') DEFAULT 'student',
  assigned_route ENUM('Biratnagar','Damak','Dharan','Inaruwa') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== PAYMENTS TABLE ==========
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('esewa','khalti','ime_pay','bank_transfer','cash') NOT NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========== BUS REGISTRATIONS TABLE ==========
CREATE TABLE bus_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_id INT NOT NULL,
  shift ENUM('morning','day') NOT NULL,
  route ENUM('Biratnagar','Damak','Dharan','Inaruwa') NOT NULL,
  bus_stop VARCHAR(100) NOT NULL,
  status ENUM('active','inactive','cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- ========== DAILY SHIFT LOGS TABLE ==========
CREATE TABLE daily_shift_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_id INT NOT NULL,
  shift ENUM('morning','day') NOT NULL,
  route ENUM('Biratnagar','Damak','Dharan','Inaruwa') NOT NULL,
  bus_stop VARCHAR(100) NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- ========== FEEDBACKS TABLE ==========
CREATE TABLE feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status ENUM('pending','replied') DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- INSERT ACCOUNTS (passwords are hashed at runtime via seed script)
-- Admin password: Admin@123
-- Driver password: Driver@123
-- These are placeholder hashes - run: cd backend && node seed.js  to set correct hashes
-- =========================================

INSERT INTO users (name,email,password,phone,student_id,semester,department,role,assigned_route)
VALUES ('Admin','admin@iic.edu.np','NEEDS_SEED','0000000000','ADMIN-001','N/A','Administration','admin',NULL);

INSERT INTO users (name,email,password,phone,student_id,semester,department,role,assigned_route)
VALUES
  ('Driver Biratnagar','driver.biratnagar@iic.edu.np','NEEDS_SEED','9800000001','DRV-BIR','N/A','Transport','driver','Biratnagar'),
  ('Driver Damak','driver.damak@iic.edu.np','NEEDS_SEED','9800000002','DRV-DAM','N/A','Transport','driver','Damak'),
  ('Driver Dharan','driver.dharan@iic.edu.np','NEEDS_SEED','9800000003','DRV-DHA','N/A','Transport','driver','Dharan'),
  ('Driver Inaruwa','driver.inaruwa@iic.edu.np','NEEDS_SEED','9800000004','DRV-INA','N/A','Transport','driver','Inaruwa');

SELECT name, email, role FROM users;
