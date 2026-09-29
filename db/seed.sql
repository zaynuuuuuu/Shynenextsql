-- Shyne Detailing — tables + demo data, for importing in phpMyAdmin.
-- Select your database on the left first, then use Import with this file. Safe to import twice.
-- Demo logins:
--   admin    admin@shyne.local / Admin@123
--   trader   trader@shyne.local / Trader@123
--   customer customer@shyne.local / Customer@123
-- Change or delete these accounts before going live.

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

-- Demo users (INSERT IGNORE skips any email that already exists)
INSERT IGNORE INTO users (name, email, password, phone, role, businessName) VALUES ('Shop Admin', 'admin@shyne.local', '$2a$12$/SPDpmzo5bYpr/BMSUWDs.CbkGZFuIKCuaFh9blhlI0tlymTHola2', '+1 555 0100', 'admin', NULL);
INSERT IGNORE INTO users (name, email, password, phone, role, businessName) VALUES ('Tom Trader', 'trader@shyne.local', '$2a$12$3mNKN5.zo6t4Ee3BMJQk5.rsST2/YysCPAbrOyC2Zodx/LL.g0xru', '+1 555 0101', 'trader', 'Downtown Motors');
INSERT IGNORE INTO users (name, email, password, phone, role, businessName) VALUES ('Casey Customer', 'customer@shyne.local', '$2a$12$aHzw1lcB5aYLit24nOb.Wuph6KDJOCDIzj8OFLwo//uCHp1rX6K.e', '+1 555 0102', 'customer', NULL);

-- Sample services (skipped if a service with the same name exists)
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Express Wash', 'Quick exterior wash and dry — great for regular upkeep.', 25, 30, 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Express Wash');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Premium Hand Wash & Wax', 'Two-bucket hand wash, clay bar decontamination and a carnauba wax finish.', 60, 60, 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Premium Hand Wash & Wax');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Interior Deep Clean', 'Full interior vacuum, upholstery shampoo, dashboard and console detailing.', 80, 90, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Interior Deep Clean');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Engine Bay Detail', 'Safe degrease, steam clean and dressing of all plastics and hoses under the hood.', 70, 60, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Engine Bay Detail');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Headlight Restoration', 'Sand, polish and UV-seal cloudy or yellowed headlights back to crystal clear.', 45, 45, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Headlight Restoration');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Full Detail Package', 'Complete interior + exterior detail including wax and tire shine.', 150, 180, 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Full Detail Package');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Paint Correction', 'Single-stage machine polish to remove swirl marks and light scratches.', 250, 240, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Paint Correction');
INSERT INTO services (name, description, price, durationMinutes, imageUrl, isActive)
SELECT 'Ceramic Coating', 'Long-lasting paint protection with a high-gloss ceramic finish.', 350, 240, 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Ceramic Coating');

-- Sample bookings, dated relative to the day you import (skipped if already present)
INSERT INTO bookings (customerId, serviceId, traderId, vehicleMake, vehicleModel, vehicleYear, vehicleColor, licensePlate, contactName, contactPhone, contactEmail, date, startTime, endTime, durationMinutes, status, notes, createdByAdmin)
SELECT cu.id, sv.id, NULL, 'Toyota', 'Corolla', '2021', 'White', 'ABC-123', 'Casey Customer', '+1 555 0102', 'customer@shyne.local', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00', '11:30', 90, 'confirmed', NULL, 0
FROM users cu JOIN services sv ON sv.name = 'Interior Deep Clean'
WHERE cu.email = 'customer@shyne.local' AND NOT EXISTS (SELECT 1 FROM bookings WHERE licensePlate = 'ABC-123')
LIMIT 1;
INSERT INTO bookings (customerId, serviceId, traderId, vehicleMake, vehicleModel, vehicleYear, vehicleColor, licensePlate, contactName, contactPhone, contactEmail, date, startTime, endTime, durationMinutes, status, notes, createdByAdmin)
SELECT cu.id, sv.id, (SELECT id FROM users WHERE email = 'trader@shyne.local'), 'Honda', 'Civic', '2019', 'Black', 'TRD-456', 'Casey Customer', '+1 555 0102', 'customer@shyne.local', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00', '12:00', 180, 'confirmed', 'Referred by Downtown Motors', 0
FROM users cu JOIN services sv ON sv.name = 'Full Detail Package'
WHERE cu.email = 'customer@shyne.local' AND NOT EXISTS (SELECT 1 FROM bookings WHERE licensePlate = 'TRD-456')
LIMIT 1;
INSERT INTO bookings (customerId, serviceId, traderId, vehicleMake, vehicleModel, vehicleYear, vehicleColor, licensePlate, contactName, contactPhone, contactEmail, date, startTime, endTime, durationMinutes, status, notes, createdByAdmin)
SELECT cu.id, sv.id, NULL, 'Toyota', 'Corolla', '2021', 'White', 'EXP-789', 'Casey Customer', '+1 555 0102', 'customer@shyne.local', DATE_ADD(CURDATE(), INTERVAL -5 DAY), '11:00', '11:30', 30, 'completed', NULL, 0
FROM users cu JOIN services sv ON sv.name = 'Express Wash'
WHERE cu.email = 'customer@shyne.local' AND NOT EXISTS (SELECT 1 FROM bookings WHERE licensePlate = 'EXP-789')
LIMIT 1;
