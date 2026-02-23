-- Shops (must exist before users)
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id TEXT,
  plan TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Users (all roles; auth via Turso, password_hash for non-customer)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('super_admin','admin','worker','customer')),
  shop_id TEXT,
  password_hash TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Cars / Visits
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  worker_id TEXT,
  shop_id TEXT NOT NULL,
  car_plate TEXT NOT NULL,
  car_model TEXT,
  service TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','washing','drying','ready','delivered')),
  estimated_time TEXT,
  photos TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash','upi','card')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid')),
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  service TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Memberships
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  washes_total INTEGER,
  washes_used INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Notifications Log
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT CHECK(channel IN ('sms','push','email')),
  message TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TEXT DEFAULT (datetime('now'))
);

-- Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration_minutes INTEGER,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Invites (shop owner invitations)
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','expired','revoked')),
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Super admin is seeded by backend/src/db/push-schema.ts (bcrypt hash for NAELZ@123)
