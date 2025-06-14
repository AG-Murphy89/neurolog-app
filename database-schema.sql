
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
