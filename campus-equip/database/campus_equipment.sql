
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
CREATE TYPE item_cond AS ENUM ('new', 'good', 'fair', 'poor', 'damaged', 'retired');
CREATE TYPE req_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue', 'cancelled');

-- Users: students, staff, administrators
CREATE TABLE users (
  user_id        BIGSERIAL PRIMARY KEY,
  school_id      VARCHAR(30) UNIQUE,
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           user_role NOT NULL DEFAULT 'student',
  department     VARCHAR(100),
  phone          VARCHAR(30),
  is_active      SMALLINT NOT NULL DEFAULT 1,
  last_login_at  TIMESTAMP NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Equipment categories
CREATE TABLE categories (
  category_id  BIGSERIAL PRIMARY KEY,
  name         VARCHAR(80) NOT NULL UNIQUE,
  description  TEXT
);

-- Equipment catalog
CREATE TABLE equipment (
  equipment_id        BIGSERIAL PRIMARY KEY,
  category_id         BIGINT NOT NULL REFERENCES categories(category_id),
  name                VARCHAR(150) NOT NULL,
  brand               VARCHAR(80),
  model               VARCHAR(80),
  description         TEXT,
  asset_tag           VARCHAR(50) UNIQUE,
  item_condition      item_cond NOT NULL DEFAULT 'good',
  total_quantity      INT NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity  INT NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  location            VARCHAR(120),
  purchase_date       DATE,
  image_url           VARCHAR(255),
  is_active           SMALLINT NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_available_le_total CHECK (available_quantity <= total_quantity)
);

CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_active ON equipment(is_active);

-- Borrow requests / borrowing records
CREATE TABLE borrow_requests (
  request_id        BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(user_id),
  equipment_id      BIGINT NOT NULL REFERENCES equipment(equipment_id),
  quantity          INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  purpose           TEXT,
  status            req_status NOT NULL DEFAULT 'pending',
  requested_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_date        DATE NULL,
  due_date          DATE NOT NULL,
  approved_by       BIGINT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at       TIMESTAMP NULL,
  admin_remarks     TEXT,
  borrowed_at       TIMESTAMP NULL,
  returned_at       TIMESTAMP NULL,
  return_condition  item_cond NULL,
  received_by       BIGINT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_due_after_start CHECK (start_date IS NULL OR due_date >= start_date),
  CONSTRAINT chk_return_after_borrow CHECK (returned_at IS NULL OR borrowed_at IS NULL OR returned_at >= borrowed_at)
);

CREATE INDEX idx_borrow_user ON borrow_requests(user_id);
CREATE INDEX idx_borrow_equipment ON borrow_requests(equipment_id);
CREATE INDEX idx_borrow_status_due ON borrow_requests(status, due_date);

-- Status history (audit trail)
CREATE TABLE request_status_history (
  history_id   BIGSERIAL PRIMARY KEY,
  request_id   BIGINT NOT NULL REFERENCES borrow_requests(request_id) ON DELETE CASCADE,
  old_status   VARCHAR(20) NULL,
  new_status   VARCHAR(20) NOT NULL,
  changed_by   BIGINT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  remarks      TEXT,
  changed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hist_request ON request_status_history(request_id);

-- In-app notifications
CREATE TABLE notifications (
  notification_id  BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  request_id       BIGINT NULL REFERENCES borrow_requests(request_id) ON DELETE CASCADE,
  type             VARCHAR(30) NOT NULL,
  message          TEXT NOT NULL,
  is_read          SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- System settings
CREATE TABLE system_settings (
  setting_key    VARCHAR(50) PRIMARY KEY,
  setting_value  VARCHAR(100) NOT NULL,
  description    VARCHAR(255)
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('max_loan_days',            '14', 'Longest allowed borrowing period in days'),
  ('max_open_requests_per_user','3', 'Maximum pending + approved + overdue requests per user');


-- =====================================================================
--  2. FUNCTIONS & TRIGGERS
-- =====================================================================

-- Equipment Insert/Update Trigger Function
CREATE OR REPLACE FUNCTION fn_equipment_mutation()
RETURNS TRIGGER AS $$
DECLARE
  v_new_avail BIGINT;
  v_diff INT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.available_quantity := NEW.total_quantity;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.total_quantity <> OLD.total_quantity AND NEW.available_quantity = OLD.available_quantity THEN
      v_diff := NEW.total_quantity - OLD.total_quantity;
      v_new_avail := OLD.available_quantity + v_diff;
      IF v_new_avail < 0 THEN
        RAISE EXCEPTION 'Cannot reduce total quantity below the number of units currently borrowed';
      END IF;
      NEW.available_quantity := v_new_avail;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipment_mutation
BEFORE INSERT OR UPDATE ON equipment
FOR EACH ROW EXECUTE FUNCTION fn_equipment_mutation();


-- Borrow Request Insert Validation Trigger Function
CREATE OR REPLACE FUNCTION fn_borrow_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_user_active  SMALLINT;
  v_eq_active    SMALLINT;
  v_cond         item_cond;
  v_total        INT;
  v_max_days     INT;
  v_max_open     INT;
  v_open         INT;
  v_overdue      INT;
BEGIN
  NEW.status := 'pending';

  SELECT is_active INTO v_user_active FROM users WHERE user_id = NEW.user_id;
  IF v_user_active IS NULL OR v_user_active = 0 THEN
    RAISE EXCEPTION 'User account is inactive or does not exist';
  END IF;

  SELECT is_active, item_condition, total_quantity
    INTO v_eq_active, v_cond, v_total
    FROM equipment WHERE equipment_id = NEW.equipment_id;
  IF v_eq_active IS NULL OR v_eq_active = 0 THEN
    RAISE EXCEPTION 'Equipment is not available in the catalog';
  END IF;
  IF v_cond::text = ANY(ARRAY['damaged', 'retired']) THEN
    RAISE EXCEPTION 'Equipment is damaged or retired and cannot be borrowed';
  END IF;
  IF NEW.quantity > v_total THEN
    RAISE EXCEPTION 'Requested quantity is more than the total owned';
  END IF;
  IF NEW.due_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Due date cannot be in the past';
  END IF;

  SELECT setting_value::INTEGER INTO v_max_days
    FROM system_settings WHERE setting_key = 'max_loan_days';
  IF (NEW.due_date - COALESCE(NEW.start_date, CURRENT_DATE)) > v_max_days THEN
    RAISE EXCEPTION 'Borrowing period is longer than the allowed maximum';
  END IF;

  SELECT COUNT(*) INTO v_overdue
    FROM borrow_requests WHERE user_id = NEW.user_id AND status = 'overdue';
  IF v_overdue > 0 THEN
    RAISE EXCEPTION 'User has overdue equipment and cannot borrow more';
  END IF;

  SELECT setting_value::INTEGER INTO v_max_open
    FROM system_settings WHERE setting_key = 'max_open_requests_per_user';
  SELECT COUNT(*) INTO v_open
    FROM borrow_requests WHERE user_id = NEW.user_id AND status IN ('pending', 'approved', 'overdue');
  IF v_open >= v_max_open THEN
    RAISE EXCEPTION 'User reached the maximum number of open requests';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_borrow_insert_check
BEFORE INSERT ON borrow_requests
FOR EACH ROW EXECUTE FUNCTION fn_borrow_before_insert();


-- Borrow Request Update Validation Trigger Function
CREATE OR REPLACE FUNCTION fn_borrow_before_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_current_user BIGINT;
BEGIN
  IF OLD.status <> NEW.status THEN
    IF NOT (
         (OLD.status = 'pending'  AND NEW.status IN ('approved', 'rejected', 'cancelled'))
      OR (OLD.status = 'approved' AND NEW.status IN ('overdue', 'returned'))
      OR (OLD.status = 'overdue'  AND NEW.status = 'returned')
    ) THEN
      RAISE EXCEPTION 'Invalid status change for this request';
    END IF;

    -- Retrieve global transaction variable for user session if set
    BEGIN
      v_current_user := current_setting('my.current_user_id', true)::BIGINT;
    EXCEPTION WHEN OTHERS THEN
      v_current_user := NULL;
    END;

    IF NEW.status IN ('approved', 'rejected') THEN
      NEW.approved_by := COALESCE(NEW.approved_by, v_current_user);
      SELECT role INTO v_role FROM users WHERE user_id = NEW.approved_by;
      IF v_role IS NULL OR v_role <> 'admin' THEN
        RAISE EXCEPTION 'Only an administrator can approve or reject requests';
      END IF;
    END IF;

    IF NEW.status = 'approved' THEN
      UPDATE equipment
         SET available_quantity = available_quantity - NEW.quantity
       WHERE equipment_id = NEW.equipment_id
         AND is_active = 1
         AND available_quantity >= NEW.quantity;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough available units to approve this request';
      END IF;
      
      NEW.approved_at := COALESCE(NEW.approved_at, CURRENT_TIMESTAMP);
      NEW.borrowed_at := COALESCE(NEW.borrowed_at, CURRENT_TIMESTAMP);

    ELSIF NEW.status = 'returned' THEN
      UPDATE equipment
         SET available_quantity = LEAST(total_quantity, available_quantity + NEW.quantity)
       WHERE equipment_id = NEW.equipment_id;
       
      NEW.returned_at := COALESCE(NEW.returned_at, CURRENT_TIMESTAMP);
      NEW.received_by := COALESCE(NEW.received_by, v_current_user);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_borrow_update_check
BEFORE UPDATE ON borrow_requests
FOR EACH ROW EXECUTE FUNCTION fn_borrow_before_update();


-- After Insert Trigger for Notifications and History
CREATE OR REPLACE FUNCTION fn_borrow_after_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_name VARCHAR(150);
BEGIN
  SELECT name INTO v_name FROM equipment WHERE equipment_id = NEW.equipment_id;

  INSERT INTO request_status_history (request_id, old_status, new_status, changed_by)
  VALUES (NEW.request_id, NULL, 'pending', NEW.user_id);

  INSERT INTO notifications (user_id, request_id, type, message)
  SELECT user_id, NEW.request_id, 'new_request',
         'New borrowing request for ' || v_name || ' (qty ' || NEW.quantity || ') is waiting for review.'
    FROM users WHERE role = 'admin' AND is_active = 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_borrow_after_ins
AFTER INSERT ON borrow_requests
FOR EACH ROW EXECUTE FUNCTION fn_borrow_after_insert();


-- After Update Trigger for Notifications and History
CREATE OR REPLACE FUNCTION fn_borrow_after_update()
RETURNS TRIGGER AS $$
DECLARE
  v_name VARCHAR(150);
  v_current_user BIGINT;
  v_msg TEXT;
BEGIN
  IF OLD.status <> NEW.status THEN
    SELECT name INTO v_name FROM equipment WHERE equipment_id = NEW.equipment_id;

    BEGIN
      v_current_user := current_setting('my.current_user_id', true)::BIGINT;
    EXCEPTION WHEN OTHERS THEN
      v_current_user := NULL;
    END;

    INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, remarks)
    VALUES (NEW.request_id, OLD.status::text, NEW.status::text, v_current_user, NEW.admin_remarks);

    IF NEW.status::text IN ('approved','rejected','overdue','returned') THEN
      v_msg := CASE NEW.status::text
        WHEN 'approved' THEN 'Your request for ' || v_name || ' was approved. Due date: ' || NEW.due_date || '.'
        WHEN 'rejected' THEN 'Your request for ' || v_name || ' was rejected. ' || COALESCE(NEW.admin_remarks, '')
        WHEN 'overdue'  THEN 'Your borrowed ' || v_name || ' is overdue. Please return it as soon as possible.'
        WHEN 'returned' THEN 'Thank you. Your return of ' || v_name || ' was recorded.'
      END;

      INSERT INTO notifications (user_id, request_id, type, message)
      VALUES (NEW.user_id, NEW.request_id, NEW.status::text, v_msg);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_borrow_after_upd
AFTER UPDATE ON borrow_requests
FOR EACH ROW EXECUTE FUNCTION fn_borrow_after_update();


-- =====================================================================
--  3. STORED PROCEDURES
-- =====================================================================

CREATE OR REPLACE PROCEDURE sp_approve_request(p_request_id BIGINT, p_admin_id BIGINT)
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('my.current_user_id', p_admin_id::text, true);
  UPDATE borrow_requests
     SET status = 'approved', approved_by = p_admin_id
   WHERE request_id = p_request_id AND status = 'pending';
   
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_reject_request(p_request_id BIGINT, p_admin_id BIGINT, p_remarks TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('my.current_user_id', p_admin_id::text, true);
  UPDATE borrow_requests
     SET status = 'rejected', approved_by = p_admin_id, admin_remarks = p_remarks
   WHERE request_id = p_request_id AND status = 'pending';
   
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_return_request(p_request_id BIGINT, p_admin_id BIGINT, p_condition item_cond)
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('my.current_user_id', p_admin_id::text, true);
  UPDATE borrow_requests
     SET status = 'returned', received_by = p_admin_id, return_condition = p_condition
   WHERE request_id = p_request_id AND status IN ('approved', 'overdue');
   
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not currently borrowed';
  END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_cancel_request(p_request_id BIGINT, p_user_id BIGINT)
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('my.current_user_id', p_user_id::text, true);
  UPDATE borrow_requests
     SET status = 'cancelled'
   WHERE request_id = p_request_id AND user_id = p_user_id AND status = 'pending';
   
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found, not yours, or not pending';
  END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE mark_overdue_requests()
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('my.current_user_id', '', true);
  UPDATE borrow_requests
     SET status = 'overdue'
   WHERE status = 'approved' AND returned_at IS NULL AND due_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE PROCEDURE send_due_soon_reminders()
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO notifications (user_id, request_id, type, message)
  SELECT b.user_id, b.request_id, 'due_soon',
         'Reminder: ' || e.name || ' is due tomorrow (' || b.due_date || ').'
    FROM borrow_requests b
    JOIN equipment e ON e.equipment_id = b.equipment_id
   WHERE b.status = 'approved'
     AND b.due_date = CURRENT_DATE + INTERVAL '1 day'
     AND NOT EXISTS (SELECT 1 FROM notifications n
                      WHERE n.request_id = b.request_id AND n.type = 'due_soon');
END;
$$;


-- =====================================================================
--  4. VIEWS
-- =====================================================================

CREATE VIEW v_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = 1)                                   AS active_users,
  (SELECT COUNT(*) FROM equipment WHERE is_active = 1)                               AS equipment_types,
  (SELECT COALESCE(SUM(total_quantity), 0)     FROM equipment WHERE is_active = 1)   AS total_units,
  (SELECT COALESCE(SUM(available_quantity), 0) FROM equipment WHERE is_active = 1)   AS units_available,
  (SELECT COUNT(*) FROM equipment WHERE is_active = 1 AND available_quantity = 0)    AS out_of_stock_items,
  (SELECT COUNT(*) FROM borrow_requests WHERE status = 'pending')                    AS pending_requests,
  (SELECT COUNT(*) FROM borrow_requests WHERE status = 'approved')                   AS active_loans,
  (SELECT COUNT(*) FROM borrow_requests WHERE status = 'overdue')                    AS overdue_loans,
  (SELECT COUNT(*) FROM borrow_requests WHERE status = 'returned')                   AS completed_loans;

CREATE VIEW v_equipment_availability AS
SELECT e.equipment_id, e.name, c.name AS category, e.item_condition, e.location,
       e.total_quantity, e.available_quantity,
       (e.total_quantity - e.available_quantity) AS borrowed_quantity,
       CASE WHEN e.available_quantity = 0 THEN 'Unavailable' ELSE 'Available' END AS availability
  FROM equipment e
  JOIN categories c ON c.category_id = e.category_id
 WHERE e.is_active = 1;

CREATE VIEW v_pending_requests AS
SELECT b.request_id, u.full_name AS borrower, u.role, e.name AS equipment, b.quantity,
       b.purpose, b.start_date, b.due_date, b.requested_at
  FROM borrow_requests b
  JOIN users u     ON u.user_id = b.user_id
  JOIN equipment e ON e.equipment_id = b.equipment_id
 WHERE b.status = 'pending'
 ORDER BY b.requested_at;

CREATE VIEW v_active_loans AS
SELECT b.request_id, u.full_name AS borrower, u.email, e.name AS equipment, b.quantity,
       b.borrowed_at, b.due_date, b.status,
       (b.due_date - CURRENT_DATE) AS days_left
  FROM borrow_requests b
  JOIN users u     ON u.user_id = b.user_id
  JOIN equipment e ON e.equipment_id = b.equipment_id
 WHERE b.status IN ('approved','overdue');

CREATE VIEW v_overdue_loans AS
SELECT b.request_id, u.full_name AS borrower, u.email, u.phone, e.name AS equipment, b.quantity,
       b.due_date, (CURRENT_DATE - b.due_date) AS days_overdue
  FROM borrow_requests b
  JOIN users u     ON u.user_id = b.user_id
  JOIN equipment e ON e.equipment_id = b.equipment_id
 WHERE b.status = 'overdue';

CREATE VIEW v_borrowing_history AS
SELECT b.request_id, u.user_id, u.full_name AS borrower, e.name AS equipment, b.quantity,
       b.status, b.requested_at, b.borrowed_at, b.due_date, b.returned_at, b.return_condition
  FROM borrow_requests b
  JOIN users u     ON u.user_id = b.user_id
  JOIN equipment e ON e.equipment_id = b.equipment_id;

CREATE VIEW v_popular_equipment AS
SELECT e.equipment_id, e.name, c.name AS category, COUNT(b.request_id) AS times_borrowed
  FROM equipment e
  JOIN categories c ON c.category_id = e.category_id
  LEFT JOIN borrow_requests b
         ON b.equipment_id = e.equipment_id AND b.status IN ('approved','overdue','returned')
 GROUP BY e.equipment_id, e.name, c.name;


-- =====================================================================
--  5. DEMO DATA SEEDING
-- =====================================================================

INSERT INTO categories (name, description) VALUES
  ('Audio/Visual', 'Projectors, cameras, microphones, speakers'),
  ('Computing',    'Laptops, tablets, peripherals'),
  ('Laboratory',   'Lab instruments and tools'),
  ('Sports',       'Sports and PE equipment'),
  ('Presentation', 'Whiteboards, pointers, display stands');

INSERT INTO users (school_id, full_name, email, password_hash, role, department) VALUES
  ('EMP-0001', 'System Administrator', 'admin@campus.edu',    'REPLACE_WITH_BCRYPT_HASH', 'admin',   'Property Office'),
  ('EMP-0102', 'Maria Santos',         'staff@campus.edu',    'REPLACE_WITH_BCRYPT_HASH', 'staff',   'IT Department'),
  ('2024-0001','Juan Dela Cruz',       'student1@campus.edu', 'REPLACE_WITH_BCRYPT_HASH', 'student', 'Computer Science'),
  ('2024-0002','Ana Reyes',            'student2@campus.edu', 'REPLACE_WITH_BCRYPT_HASH', 'student', 'Engineering');

INSERT INTO equipment (category_id, name, brand, model, description, asset_tag, item_condition, total_quantity, location) VALUES
  (1, 'LCD Projector',        'Epson',   'EB-X06',     'Portable projector with HDMI and VGA',  'AV-PRJ-001', 'good', 4,  'Property Office'),
  (2, 'Laptop',               'Lenovo',  'ThinkPad E14','14-inch laptop for classroom use',      'CP-LAP-001', 'good', 10, 'IT Room'),
  (1, 'Wireless Microphone',  'Shure',   'BLX24',      'Handheld wireless microphone set',      'AV-MIC-001', 'good', 6,  'Property Office'),
  (1, 'DSLR Camera',          'Canon',   'EOS 200D',   'Camera with 18-55mm lens and bag',      'AV-CAM-001', 'good', 3,  'Media Room'),
  (4, 'Basketball',           'Molten',  'GG7X',       'Official size basketball',              'SP-BAS-001', 'good', 12, 'Gym Storage'),
  (3, 'Digital Multimeter',   'Fluke',   '117',        'For electronics laboratory work',       'LB-MUL-001', 'new',  8,  'Electronics Lab'),
  (2, 'Tablet',               'Samsung', 'Tab A8',     '10-inch tablet',                        'CP-TAB-001', 'good', 5,  'IT Room'),
  (5, 'Portable Whiteboard',  'Quartet', 'Easel 24x36','Foldable whiteboard with stand',        'PR-WHT-001', 'fair', 4,  'Property Office'),
  (3, 'Microscope',           'Olympus', 'CX23',       'Compound microscope',                   'LB-MIC-001', 'good', 6,  'Science Lab'),
  (2, 'Wireless Presenter',   'Logitech','R400',       'Presentation remote with laser pointer','CP-PRS-001', 'good', 7,  'IT Room');

-- Demo workflow execution
INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
VALUES (3, 1, 1, 'Thesis defense presentation',  CURRENT_DATE, CURRENT_DATE + INTERVAL '3 day');
INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
VALUES (4, 2, 1, 'Programming project',          CURRENT_DATE, CURRENT_DATE + INTERVAL '5 day');
INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
VALUES (3, 4, 1, 'Documentary shoot',            CURRENT_DATE, CURRENT_DATE + INTERVAL '2 day');
INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
VALUES (4, 3, 2, 'Class recital',                CURRENT_DATE, CURRENT_DATE + INTERVAL '7 day');
INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
VALUES (2, 5, 2, 'Faculty sports day',           CURRENT_DATE, CURRENT_DATE + INTERVAL '4 day');

CALL sp_approve_request(1, 1);
CALL sp_approve_request(2, 1);
CALL sp_return_request(2, 1, 'good');
CALL sp_approve_request(4, 1);
CALL sp_reject_request(5, 1, 'Gym is reserved for the same dates.');

UPDATE borrow_requests
   SET start_date  = CURRENT_DATE - INTERVAL '10 day',
       due_date    = CURRENT_DATE - INTERVAL '2 day',
       borrowed_at = CURRENT_TIMESTAMP - INTERVAL '10 day'
 WHERE request_id = 4;
CALL mark_overdue_requests();