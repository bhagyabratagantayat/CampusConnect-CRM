-- Drop tables if they exist
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS followups;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'COUNSELOR', 'MANAGER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(20),
    course_interested VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    source VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    assigned_counselor VARCHAR(255), -- Keep for backward compatibility/legacy display
    counselor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Real link for RBAC
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create followups table
CREATE TABLE followups (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_counselor_id ON leads(counselor_id);
CREATE INDEX idx_followups_lead_id ON followups(lead_id);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Default ADMIN User (Password: admin123)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('System Admin', 'admin@crm.com', '$2b$10$2OfZbCgj41ecubE2.o0VO.4Vn77sBGnHXY6BA4zKFJYWhyiyZMOmO', 'ADMIN');

-- Default COUNSELOR User (Password: counselor123)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('Jane Counselor', 'counselor@crm.com', '$2b$10$G.8h/MF0COMiAODRL6Ne0..aSksFiRebQTJVqFmxJnxS5saJEqAq.', 'COUNSELOR');



