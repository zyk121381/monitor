DROP TABLE IF EXISTS status_page_agents;
DROP TABLE IF EXISTS status_page_monitors;
DROP TABLE IF EXISTS status_page_config;
DROP TABLE IF EXISTS monitor_status_history;
DROP TABLE IF EXISTS monitor_checks;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS monitors;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 监控表
CREATE TABLE IF NOT EXISTS monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  interval INTEGER NOT NULL DEFAULT 60,
  timeout INTEGER NOT NULL DEFAULT 30,
  expected_status INTEGER NOT NULL DEFAULT 200,
  headers TEXT DEFAULT '{}',
  body TEXT DEFAULT '',
  created_by INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending',
  uptime REAL DEFAULT 100.0,
  response_time INTEGER DEFAULT 0,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 监控历史记录表
CREATE TABLE IF NOT EXISTS monitor_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  response_time INTEGER,
  status_code INTEGER,
  error TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id)
);

-- 监控状态历史表（用于UI状态条展示）
CREATE TABLE IF NOT EXISTS monitor_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id)
);

-- 客户端表
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by INTEGER NOT NULL,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hostname TEXT,
  ip_address TEXT,
  os TEXT,
  version TEXT,
  cpu_usage REAL,
  memory_total INTEGER,
  memory_used INTEGER,
  disk_total INTEGER,
  disk_used INTEGER,
  network_rx INTEGER,
  network_tx INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 状态页配置表
CREATE TABLE IF NOT EXISTS status_page_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '系统状态',
  description TEXT DEFAULT '系统当前运行状态',
  logo_url TEXT DEFAULT '',
  custom_css TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 状态页监控项关联表
CREATE TABLE IF NOT EXISTS status_page_monitors (
  config_id INTEGER NOT NULL,
  monitor_id INTEGER NOT NULL,
  PRIMARY KEY (config_id, monitor_id),
  FOREIGN KEY (config_id) REFERENCES status_page_config(id) ON DELETE CASCADE,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

-- 状态页客户端关联表
CREATE TABLE IF NOT EXISTS status_page_agents (
  config_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  PRIMARY KEY (config_id, agent_id),
  FOREIGN KEY (config_id) REFERENCES status_page_config(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- 初始管理员用户 (密码: admin123)
INSERT OR IGNORE INTO users (id, username, password, role) 
VALUES (1, 'admin', '$2a$10$X7o4c5/QR.uQr.1aDqUIO.VMbDwGy5ETSqMxE8tRP5oG5GQIMCg1W', 'admin'); 