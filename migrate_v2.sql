-- Migration v2: rimuove CHECK constraint su shift_type
-- Permette valori liberi come "Altro: testo", "P 📞", "C 📞"

PRAGMA defer_foreign_keys = on;

-- Ricrea tabella shifts senza CHECK constraint
CREATE TABLE IF NOT EXISTS shifts_v2 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_date  TEXT    NOT NULL,
  shift_type  TEXT    NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Copia tutti i dati esistenti
INSERT INTO shifts_v2 (id, employee_id, shift_date, shift_type)
SELECT id, employee_id, shift_date, shift_type FROM shifts;

-- Sostituisci la tabella
DROP TABLE shifts;
ALTER TABLE shifts_v2 RENAME TO shifts;

-- Ricrea gli indici
CREATE INDEX IF NOT EXISTS idx_shift_emp ON shifts(employee_id);

PRAGMA defer_foreign_keys = off;
