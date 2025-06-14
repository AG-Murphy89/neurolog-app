
-- Enhanced medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  dosage_unit TEXT NOT NULL DEFAULT 'mg',
  frequency TEXT NOT NULL,
  schedule_times TEXT[] NOT NULL DEFAULT ARRAY['08:00'],
  start_date DATE NOT NULL,
  end_date DATE,
  prescribing_doctor TEXT NOT NULL,
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  side_effects TEXT[] DEFAULT ARRAY[]::TEXT[],
  effectiveness_rating INTEGER DEFAULT 3 CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  days_supply INTEGER DEFAULT 30,
  next_refill_date DATE,
  special_instructions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'discontinued')),
  reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track medication adherence
CREATE TABLE IF NOT EXISTS medication_taken (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  taken_date DATE NOT NULL,
  taken_time TIME NOT NULL,
  scheduled_time TIME NOT NULL,
  taken BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, medication_id, taken_date, scheduled_time)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_medication_taken_user_id ON medication_taken(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_taken_date ON medication_taken(taken_date);

-- Row Level Security
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_taken ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications
CREATE POLICY "Users can view their own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for medication_taken
CREATE POLICY "Users can view their own medication tracking" ON medication_taken
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication tracking" ON medication_taken
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication tracking" ON medication_taken
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication tracking" ON medication_taken
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for medications table
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE
  ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Doctors table for healthcare professionals
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gmc_number TEXT UNIQUE NOT NULL,
  speciality TEXT NOT NULL,
  practice_name TEXT NOT NULL,
  practice_address TEXT,
  phone_number TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_id TEXT,
  billing_email TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient-Doctor relationships for consent management
CREATE TABLE IF NOT EXISTS patient_doctor_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  consent_status TEXT DEFAULT 'pending' CHECK (consent_status IN ('pending', 'approved', 'revoked')),
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_expiry TIMESTAMP WITH TIME ZONE,
  data_sharing_level TEXT DEFAULT 'basic' CHECK (data_sharing_level IN ('basic', 'full', 'emergency_only')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  notes TEXT,
  next_appointment TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

-- Clinical notes by doctors
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('observation', 'diagnosis', 'treatment', 'followup', 'medication', 'emergency')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT false,
  tags TEXT[],
  severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor audit log for compliance
CREATE TABLE IF NOT EXISTS doctor_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor subscription usage tracking
CREATE TABLE IF NOT EXISTS doctor_usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value INTEGER DEFAULT 1,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX(doctor_id, billing_period_start, billing_period_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_gmc ON doctors(gmc_number);
CREATE INDEX IF NOT EXISTS idx_doctors_subscription ON doctors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_patient ON patient_doctor_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_doctor ON patient_doctor_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_consent ON patient_doctor_relationships(consent_status);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor ON clinical_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_date ON clinical_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_doctor ON doctor_audit_log(doctor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON doctor_audit_log(created_at);

-- Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors
CREATE POLICY "Doctors can view their own profile" ON doctors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can update their own profile" ON doctors
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for patient_doctor_relationships
CREATE POLICY "Doctors can view their patient relationships" ON patient_doctor_relationships
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their doctor relationships" ON patient_doctor_relationships
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update their patient relationships" ON patient_doctor_relationships
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can update their doctor relationships" ON patient_doctor_relationships
  FOR UPDATE USING (auth.uid() = patient_id);

-- RLS Policies for clinical_notes
CREATE POLICY "Doctors can view their clinical notes" ON clinical_notes
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their clinical notes" ON clinical_notes
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their clinical notes" ON clinical_notes
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their clinical notes" ON clinical_notes
  FOR DELETE USING (auth.uid() = doctor_id);

-- RLS Policies for doctor_audit_log
CREATE POLICY "Doctors can view their own audit log" ON doctor_audit_log
  FOR SELECT USING (auth.uid() = doctor_id);

-- RLS Policies for doctor_usage_tracking
CREATE POLICY "Doctors can view their own usage" ON doctor_usage_tracking
  FOR SELECT USING (auth.uid() = doctor_id);

-- Function to log doctor actions
CREATE OR REPLACE FUNCTION log_doctor_action(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO doctor_audit_log (
    doctor_id,
    patient_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_doctor_id,
    p_patient_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check doctor subscription status
CREATE OR REPLACE FUNCTION check_doctor_subscription(p_doctor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  doc_record RECORD;
BEGIN
  SELECT subscription_status, trial_ends_at
  INTO doc_record
  FROM doctors
  WHERE id = p_doctor_id;
  
  IF doc_record.subscription_status = 'active' THEN
    RETURN TRUE;
  ELSIF doc_record.subscription_status = 'trial' AND doc_record.trial_ends_at > NOW() THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE
  ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_doctor_relationships_updated_at BEFORE UPDATE
  ON patient_doctor_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE
  ON clinical_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample doctor (for demo purposes)
INSERT INTO doctors (
  id, email, full_name, gmc_number, speciality, practice_name, subscription_status, is_verified
) VALUES (
  'sample-doctor-id', 'doctor@example.com', 'Dr. Sarah Johnson', 'GMC123456', 
  'Neurology', 'St. Mary\'s Hospital', 'trial', true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample medications (for demo purposes)
INSERT INTO medications (
  user_id, name, generic_name, dosage, dosage_unit, frequency, schedule_times,
  start_date, prescribing_doctor, effectiveness_rating, days_supply, status
) VALUES 
  -- Note: Replace 'sample-user-id' with actual user IDs
  ('sample-user-id', 'Levetiracetam', 'Keppra', '500', 'mg', 'twice-daily', 
   ARRAY['08:00', '20:00'], CURRENT_DATE - INTERVAL '30 days', 'Dr. Smith', 4, 30, 'active'),
  ('sample-user-id', 'Lamotrigine', 'Lamictal', '100', 'mg', 'twice-daily', 
   ARRAY['08:00', '20:00'], CURRENT_DATE - INTERVAL '60 days', 'Dr. Smith', 5, 30, 'active'),
  ('sample-user-id', 'Lorazepam', 'Ativan', '1', 'mg', 'as-needed', 
   ARRAY['09:00'], CURRENT_DATE - INTERVAL '90 days', 'Dr. Johnson', 3, 10, 'active');
