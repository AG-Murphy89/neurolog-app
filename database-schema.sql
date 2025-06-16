-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    account_type TEXT CHECK (account_type IN ('patient', 'family', 'home_carer', 'professional', 'care_home')) DEFAULT 'patient',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seizure records table
CREATE TABLE IF NOT EXISTS seizure_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    seizure_date DATE NOT NULL,
    seizure_time TIME NOT NULL,
    duration TEXT NOT NULL,
    seizure_type TEXT NOT NULL,
    triggers TEXT,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5) NOT NULL,
    symptoms TEXT,
    medication_taken TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time_slots TEXT[] NOT NULL,
    prescribing_doctor TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    side_effects TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Medication logs table
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    medication_id UUID REFERENCES medications ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    taken_time TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('taken', 'missed', 'skipped', 'delayed')) NOT NULL DEFAULT 'missed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    contact_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Next of kin table
CREATE TABLE IF NOT EXISTS next_of_kin (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    date_of_birth DATE,
    address TEXT,
    primary_phone TEXT NOT NULL,
    alternative_phone TEXT,
    email TEXT NOT NULL,
    medical_authority BOOLEAN DEFAULT FALSE,
    access_records BOOLEAN DEFAULT FALSE,
    emergency_contact BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Doctors table (for healthcare professionals)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    medical_license_number TEXT UNIQUE NOT NULL,
    specialization TEXT NOT NULL,
    hospital_affiliation TEXT,
    phone_number TEXT,
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    verification_documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Patient consent for doctor access
CREATE TABLE IF NOT EXISTS patient_doctor_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES doctors ON DELETE CASCADE NOT NULL,
    consent_status TEXT CHECK (consent_status IN ('pending', 'approved', 'revoked')) DEFAULT 'pending',
    access_level TEXT CHECK (access_level IN ('read', 'write', 'full')) DEFAULT 'read',
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(patient_id, doctor_id)
);

-- Clinical notes (doctor observations)
CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES doctors ON DELETE CASCADE NOT NULL,
    note_type TEXT CHECK (note_type IN ('observation', 'diagnosis', 'treatment', 'followup')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Care homes table
CREATE TABLE IF NOT EXISTS care_homes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    cqc_number TEXT UNIQUE NOT NULL,
    resident_capacity INTEGER NOT NULL,
    subscription_plan TEXT CHECK (subscription_plan IN ('standard', 'premium', 'enterprise')) DEFAULT 'standard',
    billing_contact TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Care home staff table
CREATE TABLE IF NOT EXISTS care_home_staff (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('senior_carer', 'healthcare_assistant', 'nurse', 'manager')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Care home residents table
CREATE TABLE IF NOT EXISTS care_home_residents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    room_number TEXT NOT NULL,
    care_level TEXT CHECK (care_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    seizure_type TEXT,
    next_of_kin TEXT NOT NULL,
    gp_name TEXT NOT NULL,
    risk_assessment TEXT CHECK (risk_assessment IN ('green', 'amber', 'red')) DEFAULT 'green',
    mobility_level TEXT,
    dietary_requirements TEXT,
    emergency_contact TEXT NOT NULL,
    admission_date DATE NOT NULL,
    care_plan_review_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Care home incidents table
CREATE TABLE IF NOT EXISTS care_home_incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes ON DELETE CASCADE NOT NULL,
    resident_id UUID REFERENCES care_home_residents ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES care_home_staff ON DELETE CASCADE NOT NULL,
    incident_type TEXT CHECK (incident_type IN ('seizure', 'fall', 'medication_error', 'behavioral', 'other')) NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5) NOT NULL,
    description TEXT NOT NULL,
    actions_taken TEXT NOT NULL,
    family_notified BOOLEAN DEFAULT FALSE,
    gp_contacted BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('open', 'investigating', 'closed')) DEFAULT 'open',
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seizure_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_incidents ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Seizure records policies
CREATE POLICY "Users can view own seizure records" ON seizure_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own seizure records" ON seizure_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own seizure records" ON seizure_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own seizure records" ON seizure_records FOR DELETE USING (auth.uid() = user_id);

-- Doctors can view seizure records if patient has given consent
CREATE POLICY "Doctors can view patient seizure records with consent" ON seizure_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM patient_doctor_access pda
        WHERE pda.patient_id = seizure_records.user_id
        AND pda.doctor_id = auth.uid()
        AND pda.consent_status = 'approved'
    )
);

-- Medications policies
CREATE POLICY "Users can view own medications" ON medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON medications FOR DELETE USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can view own medication logs" ON medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medication logs" ON medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medication logs" ON medication_logs FOR UPDATE USING (auth.uid() = user_id);

-- Emergency contacts policies
CREATE POLICY "Users can view own emergency contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emergency contacts" ON emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency contacts" ON emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emergency contacts" ON emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- Next of kin policies
CREATE POLICY "Users can view own next of kin" ON next_of_kin FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own next of kin" ON next_of_kin FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own next of kin" ON next_of_kin FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own next of kin" ON next_of_kin FOR DELETE USING (auth.uid() = user_id);

-- Doctors policies
CREATE POLICY "Doctors can view own profile" ON doctors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors can update own profile" ON doctors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Doctors can insert own profile" ON doctors FOR INSERT WITH CHECK (auth.uid() = id);

-- Patient doctor access policies
CREATE POLICY "Patients can view own doctor access" ON patient_doctor_access FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can manage own doctor access" ON patient_doctor_access FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view their patient access" ON patient_doctor_access FOR SELECT USING (auth.uid() = doctor_id);

-- Clinical notes policies
CREATE POLICY "Doctors can view own clinical notes" ON clinical_notes FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert clinical notes" ON clinical_notes FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own clinical notes" ON clinical_notes FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can view their clinical notes" ON clinical_notes FOR SELECT USING (
    auth.uid() = patient_id AND is_confidential = FALSE
);

-- Care home policies
CREATE POLICY "Care home staff can view their care home" ON care_homes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM care_home_staff chs
        WHERE chs.care_home_id = care_homes.id
        AND chs.id = auth.uid()
        AND chs.is_active = TRUE
    )
);

-- Care home staff policies
CREATE POLICY "Staff can view own profile" ON care_home_staff FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view colleagues in same care home" ON care_home_staff FOR SELECT USING (
    care_home_id IN (
        SELECT care_home_id FROM care_home_staff WHERE id = auth.uid() AND is_active = TRUE
    )
);

-- Care home residents policies
CREATE POLICY "Care home staff can view residents" ON care_home_residents FOR SELECT USING (
    care_home_id IN (
        SELECT care_home_id FROM care_home_staff WHERE id = auth.uid() AND is_active = TRUE
    )
);
CREATE POLICY "Care home staff can manage residents" ON care_home_residents FOR ALL USING (
    care_home_id IN (
        SELECT care_home_id FROM care_home_staff WHERE id = auth.uid() AND is_active = TRUE
    )
);

-- Care home incidents policies
CREATE POLICY "Care home staff can view incidents" ON care_home_incidents FOR SELECT USING (
    care_home_id IN (
        SELECT care_home_id FROM care_home_staff WHERE id = auth.uid() AND is_active = TRUE
    )
);
CREATE POLICY "Care home staff can manage incidents" ON care_home_incidents FOR ALL USING (
    care_home_id IN (
        SELECT care_home_id FROM care_home_staff WHERE id = auth.uid() AND is_active = TRUE
    )
);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_seizure_records
    BEFORE UPDATE ON seizure_records
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_medications
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_emergency_contacts
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_next_of_kin
    BEFORE UPDATE ON next_of_kin
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_doctors
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_clinical_notes
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_care_homes
    BEFORE UPDATE ON care_homes
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_care_home_staff
    BEFORE UPDATE ON care_home_staff
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_care_home_residents
    BEFORE UPDATE ON care_home_residents
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_care_home_incidents
    BEFORE UPDATE ON care_home_incidents
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seizure_records_user_id ON seizure_records(user_id);
CREATE INDEX IF NOT EXISTS idx_seizure_records_date ON seizure_records(seizure_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_user_id ON next_of_kin(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_access_patient_id ON patient_doctor_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_access_doctor_id ON patient_doctor_access(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor_id ON clinical_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_care_home_staff_care_home_id ON care_home_staff(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_residents_care_home_id ON care_home_residents(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_incidents_care_home_id ON care_home_incidents(care_home_id);