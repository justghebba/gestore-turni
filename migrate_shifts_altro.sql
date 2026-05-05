PRAGMA defer_foreign_keys = on;

CREATE TABLE shifts_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_date  TEXT    NOT NULL,
  shift_type  TEXT    NOT NULL
    CHECK(shift_type IN ('Pranzo','Cena','Pranzo e cena','Dayoff','Altro')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

INSERT INTO shifts_new (id, employee_id, shift_date, shift_type)
SELECT id, employee_id, shift_date, shift_type
FROM shifts;

DROP TABLE shifts;
ALTER TABLE shifts_new RENAME TO shifts;
CREATE INDEX IF NOT EXISTS idx_shift_emp ON shifts(employee_id);

PRAGMA defer_foreign_keys = off;
