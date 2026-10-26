CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    contact_number VARCHAR(20) NOT NULL
);

CREATE TABLE students (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    student_number VARCHAR(30) UNIQUE NOT NULL,
    course VARCHAR(100) NOT NULL,
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 6)
    
);

CREATE TABLE staff (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100)
);

CREATE TABLE admins (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    office VARCHAR(100) NOT NULL,
);

-- ---------- Equipment ----------
CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'good',
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    available INT NOT NULL DEFAULT 1 CHECK (available >= 0)
);

-- ---------- Borrowing ----------
CREATE TABLE borrow_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    equipment_id INT NOT NULL REFERENCES equipment(equipment_id),
    approved_by INT REFERENCES admins(user_id),
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'overdue')),
    request_date TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date DATE NOT NULL,
    return_date DATE
);

-- ---------- Notifications ----------
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
