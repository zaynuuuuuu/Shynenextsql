// MySQL table definitions. Every statement is idempotent (CREATE TABLE IF NOT EXISTS),
// so this runs automatically on the app's first DB call and from `npm run seed`.
// db/schema.sql holds the same SQL for importing by hand (e.g. via phpMyAdmin).

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS services (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // isLive is 1 for active bookings and NULL for cancelled ones. Unique keys ignore
  // NULLs, so (date, startTime, isLive) is only unique among live bookings — the
  // equivalent of the old Mongo partial unique index on (date, startTime) where
  // status != 'cancelled'. It's the hard DB-level backstop against two requests
  // racing into the same slot. (The expression deliberately avoids any date-to-string
  // conversion, which MariaDB rejects in generated columns.)
  `CREATE TABLE IF NOT EXISTS bookings (
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
    isLive TINYINT(1) AS (IF(status <> 'cancelled', 1, NULL)) STORED,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_active_slot (date, startTime, isLive),
    KEY idx_date (date),
    KEY idx_customer (customerId),
    KEY idx_status (status),
    KEY idx_trader (traderId),
    CONSTRAINT fk_booking_customer FOREIGN KEY (customerId) REFERENCES users (id),
    CONSTRAINT fk_booking_service FOREIGN KEY (serviceId) REFERENCES services (id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_trader FOREIGN KEY (traderId) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];
