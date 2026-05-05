PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schedules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  week_start TEXT    NOT NULL,
  week_end   TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  name        TEXT    NOT NULL,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shifts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_date  TEXT    NOT NULL,
  shift_type  TEXT    NOT NULL
    CHECK(shift_type IN ('Pranzo','Cena','Pranzo e cena','Dayoff')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emp_schedule ON employees(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shift_emp    ON shifts(employee_id);
