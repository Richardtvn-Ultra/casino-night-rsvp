DROP TABLE IF EXISTS rsvps;

CREATE TABLE rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  attending TEXT NOT NULL,
  bringing_partner TEXT,
  dietary TEXT,
  dietary_other TEXT,
  table_preference TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_rsvps_submitted_at ON rsvps (submitted_at);
