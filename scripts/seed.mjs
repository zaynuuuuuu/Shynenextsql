// Creates the MySQL database + tables (if missing) and seeds demo data:
//   - 3 demo users: admin, trader, customer
//   - a set of sample services
//   - a few sample bookings (only when the bookings table is empty)
// Run with: npm run seed
// Idempotent — safe to re-run; it skips anything that already exists.
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true }); // Next.js convention — loaded second so it wins if both exist
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { SCHEMA_STATEMENTS } from '../lib/schema.mjs';

const DEMO_USERS = [
  { name: 'Shop Admin', email: 'admin@shyne.local', password: 'Admin@123', role: 'admin', phone: '+1 555 0100' },
  { name: 'Tom Trader', email: 'trader@shyne.local', password: 'Trader@123', role: 'trader', phone: '+1 555 0101', businessName: 'Downtown Motors' },
  { name: 'Casey Customer', email: 'customer@shyne.local', password: 'Customer@123', role: 'customer', phone: '+1 555 0102' },
];

const SAMPLE_SERVICES = [
  {
    name: 'Express Wash',
    description: 'Quick exterior wash and dry — great for regular upkeep.',
    price: 25,
    durationMinutes: 30,
    imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800',
  },
  {
    name: 'Premium Hand Wash & Wax',
    description: 'Two-bucket hand wash, clay bar decontamination and a carnauba wax finish.',
    price: 60,
    durationMinutes: 60,
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800',
  },
  {
    name: 'Interior Deep Clean',
    description: 'Full interior vacuum, upholstery shampoo, dashboard and console detailing.',
    price: 80,
    durationMinutes: 90,
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  },
  {
    name: 'Engine Bay Detail',
    description: 'Safe degrease, steam clean and dressing of all plastics and hoses under the hood.',
    price: 70,
    durationMinutes: 60,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
  },
  {
    name: 'Headlight Restoration',
    description: 'Sand, polish and UV-seal cloudy or yellowed headlights back to crystal clear.',
    price: 45,
    durationMinutes: 45,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  },
  {
    name: 'Full Detail Package',
    description: 'Complete interior + exterior detail including wax and tire shine.',
    price: 150,
    durationMinutes: 180,
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800',
  },
  {
    name: 'Paint Correction',
    description: 'Single-stage machine polish to remove swirl marks and light scratches.',
    price: 250,
    durationMinutes: 240,
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  },
  {
    name: 'Ceramic Coating',
    description: 'Long-lasting paint protection with a high-gloss ceramic finish.',
    price: 350,
    durationMinutes: 240,
    imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
  },
];

const dayOffset = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const addMinutes = (hhmm, minutes) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Connection settings — same env vars the app uses (see lib/db.js).
function connectionConfig(withDatabase) {
  const shared = { timezone: 'Z', dateStrings: ['DATE'], decimalNumbers: true };
  if (process.env.DATABASE_URL) return { ...shared, uri: process.env.DATABASE_URL };
  return {
    ...shared,
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    ...(withDatabase ? { database: process.env.MYSQL_DATABASE } : {}),
  };
}

const run = async () => {
  // Create the database itself if it doesn't exist yet (local MySQL/XAMPP).
  // Skipped for DATABASE_URL, where the database is part of the URL already.
  if (!process.env.DATABASE_URL) {
    const dbName = process.env.MYSQL_DATABASE;
    if (!dbName) throw new Error('MYSQL_DATABASE is not set in .env.local');
    const server = await mysql.createConnection(connectionConfig(false));
<<<<<<< HEAD
    await server.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
=======
    try {
      await server.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch (err) {
      // Shared hosts (Hostinger, cPanel) create the database in their panel and don't
      // let the DB user run CREATE DATABASE — fine, as long as it already exists.
      if (!['ER_DBACCESS_DENIED_ERROR', 'ER_SPECIFIC_ACCESS_DENIED_ERROR', 'ER_ACCESS_DENIED_ERROR'].includes(err.code)) throw err;
    }
>>>>>>> aa2c114 (Initial commit)
    await server.end();
  }

  const db = await mysql.createConnection(connectionConfig(true));
  await db.query("SET time_zone = '+00:00'");
  for (const sql of SCHEMA_STATEMENTS) await db.query(sql);
  console.log('Tables are ready.');

  // --- Users
  const userIds = {};
  for (const u of DEMO_USERS) {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length) {
      userIds[u.role] = existing[0].id;
      console.log(`User ${u.email} already exists, skipping.`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, await bcrypt.genSalt(12));
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role, businessName) VALUES (?, ?, ?, ?, ?, ?)',
      [u.name, u.email, hash, u.phone, u.role, u.businessName || null]
    );
    userIds[u.role] = result.insertId;
    console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
  }

  // --- Services
  const serviceIds = {};
  for (const s of SAMPLE_SERVICES) {
    const [existing] = await db.query('SELECT id FROM services WHERE name = ?', [s.name]);
    if (existing.length) {
      serviceIds[s.name] = existing[0].id;
      continue;
    }
    const [result] = await db.query('INSERT INTO services SET ?', [{ ...s, isActive: 1 }]);
    serviceIds[s.name] = result.insertId;
  }
  console.log(`Services ready (${SAMPLE_SERVICES.length} sample services).`);

  // --- Sample bookings (only into an empty table, so re-runs never collide with real data)
  const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM bookings');
  if (count === 0) {
    const customer = DEMO_USERS.find((u) => u.role === 'customer');
    const book = (serviceName, date, startTime, extra = {}) => {
      const service = SAMPLE_SERVICES.find((s) => s.name === serviceName);
      return {
        customerId: userIds.customer,
        serviceId: serviceIds[serviceName],
        traderId: null,
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla',
        vehicleYear: '2021',
        vehicleColor: 'White',
        licensePlate: 'ABC-123',
        contactName: customer.name,
        contactPhone: customer.phone,
        contactEmail: customer.email,
        date,
        startTime,
        endTime: addMinutes(startTime, service.durationMinutes),
        durationMinutes: service.durationMinutes,
        status: 'confirmed',
        notes: null,
        createdByAdmin: 0,
        ...extra,
      };
    };

    const samples = [
      // Customer self-booking, upcoming
      book('Interior Deep Clean', dayOffset(2), '10:00'),
      // Submitted by the trader on the customer's behalf, upcoming
      book('Full Detail Package', dayOffset(3), '09:00', {
        traderId: userIds.trader,
        vehicleMake: 'Honda',
        vehicleModel: 'Civic',
        vehicleYear: '2019',
        vehicleColor: 'Black',
        licensePlate: 'TRD-456',
        notes: 'Referred by Downtown Motors',
      }),
      // Past booking, already completed
      book('Express Wash', dayOffset(-5), '11:00', { status: 'completed' }),
    ];
    for (const b of samples) await db.query('INSERT INTO bookings SET ?', [b]);
    console.log(`Created ${samples.length} sample bookings.`);
  } else {
    console.log('Bookings table already has data, skipping sample bookings.');
  }

  await db.end();
  console.log('\nDone. Demo logins:');
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(8)} ${u.email} / ${u.password}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
