-- Shyne Detailing — MySQL schema (MySQL 5.7+ / MariaDB 10.2+).
-- The app also creates these tables automatically on first run, and `npm run seed`
-- creates them plus demo data. Generated from lib/schema.mjs — edit that file, not this one.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NULL,
  role ENUM('customer', 'admin', 'trader') NOT NULL DEFAULT 'customer',
  businessName VARCHAR(191) NULL,
  resetPasswordToken VARCHAR(64) NULL,
  resetPasswordExpire DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email (email),
  KEY idx_role (role),
  KEY idx_reset_token (resetPasswordToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  durationMinutes INT UNSIGNED NOT NULL,
  imageUrl VARCHAR(500) NOT NULL DEFAULT '',
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customerId INT UNSIGNED NOT NULL,
  serviceId INT UNSIGNED NULL,
  traderId INT UNSIGNED NULL,
  vehicleMake VARCHAR(100) NOT NULL,
  vehicleModel VARCHAR(100) NOT NULL,
  vehicleYear VARCHAR(10) NULL,
  vehicleColor VARCHAR(50) NULL,
  licensePlate VARCHAR(30) NULL,
  contactName VARCHAR(120) NOT NULL,
  contactPhone VARCHAR(40) NOT NULL,
  contactEmail VARCHAR(191) NOT NULL,
  date DATE NOT NULL,
  startTime CHAR(5) NOT NULL,
  endTime CHAR(5) NOT NULL,
  durationMinutes INT UNSIGNED NOT NULL,
  status ENUM('confirmed', 'completed', 'cancelled', 'no-show') NOT NULL DEFAULT 'confirmed',
  notes TEXT NULL,
  createdByAdmin TINYINT(1) NOT NULL DEFAULT 0,
  activeSlot VARCHAR(20) AS (IF(status <> 'cancelled', CONCAT(date, ' ', startTime), NULL)) STORED,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_active_slot (activeSlot),
  KEY idx_date (date),
  KEY idx_customer (customerId),
  KEY idx_status (status),
  KEY idx_trader (traderId),
  CONSTRAINT fk_booking_customer FOREIGN KEY (customerId) REFERENCES users (id),
  CONSTRAINT fk_booking_service FOREIGN KEY (serviceId) REFERENCES services (id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_trader FOREIGN KEY (traderId) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
