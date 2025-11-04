import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'smart_ventilation_system'
};

let pool = null;

export async function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

export async function initializeDatabase() {
  // Create database if it doesn't exist using a server connection
  const serverConn = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port
  });
  await serverConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await serverConn.end();

  const pool = await getDbPool();

  // Users table (with profile_photo)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      profile_photo VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Fans table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      device_id VARCHAR(128) NULL,
      thing_id VARCHAR(128) NULL,
      status ENUM('ON','OFF') DEFAULT 'OFF',
      runtime_hours DECIMAL(10,2) DEFAULT 0,
      runtime_today DECIMAL(10,2) DEFAULT 0,
      last_on_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Backfill columns if schema existed before
  await pool.query("ALTER TABLE fans ADD COLUMN IF NOT EXISTS device_id VARCHAR(128) NULL");
  await pool.query("ALTER TABLE fans ADD COLUMN IF NOT EXISTS thing_id VARCHAR(128) NULL");
  await pool.query("ALTER TABLE fans ADD COLUMN IF NOT EXISTS runtime_today DECIMAL(10,2) DEFAULT 0");

  // Fan data table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fan_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fan_id INT NOT NULL,
      gas_level DECIMAL(10,2) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fan_id) REFERENCES fans(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Products
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Reviews
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      review_text TEXT,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Contacts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Uploads (kept for profile photos and assets)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      path VARCHAR(512) NOT NULL,
      mimetype VARCHAR(128) NOT NULL,
      size INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Seed demo products if empty
  await pool.query(`
    INSERT INTO products (name, description, price, image)
    SELECT * FROM (
      SELECT 'Smart Fan Controller','IoT controller for restroom fans',129.99,'/uploads/controller.png'
      UNION ALL SELECT 'Gas Sensor Module','High-precision MQ-135 gas sensor',39.99,'/uploads/sensor.png'
      UNION ALL SELECT 'ESP32 Board','WiFi/BLE MCU',19.99,'/uploads/esp32.png'
    ) AS tmp
    WHERE NOT EXISTS (SELECT 1 FROM products);
  `);
}

