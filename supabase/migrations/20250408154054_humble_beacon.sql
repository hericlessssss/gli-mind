/*
  # Reset and recreate database schema

  1. Changes
    - Drop existing tables
    - Recreate tables with proper structure
    - Set up RLS policies
    - Add necessary triggers and functions

  2. Tables
    - profiles: User profiles with basic information
    - glucose_readings: Glucose measurements with meal and insulin data
*/

-- Drop existing tables (in correct order due to dependencies)
DROP TABLE IF EXISTS glucose_readings CASCADE;
DROP TABLE IF EXISTS meal_items CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS insulin_applications CASCADE;
DROP TABLE IF EXISTS glicemia_registros CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create glucose_readings table
CREATE TABLE glucose_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  glucose_level integer NOT NULL CHECK (glucose_level > 0),
  timestamp timestamptz NOT NULL DEFAULT now(),
  meal_type text NOT NULL CHECK (meal_type = ANY (ARRAY[
    'fasting', 'pre_breakfast', 'post_breakfast', 
    'pre_lunch', 'post_lunch', 'pre_dinner', 
    'post_dinner', 'bedtime'
  ])),
  insulin_applied boolean DEFAULT false,
  insulin_units numeric CHECK (insulin_units > 0 AND insulin_units <= 10),
  meal_items jsonb[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create meal_items validation function
CREATE OR REPLACE FUNCTION validate_meal_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.meal_items IS NOT NULL THEN
    IF NOT (
      SELECT bool_and(
        (value->>'name') IS NOT NULL AND
        (value->>'is_custom') IS NOT NULL AND
        (value->>'high_glycemic') IS NOT NULL AND
        (value->>'category') IS NOT NULL
      )
      FROM jsonb_array_elements(array_to_json(NEW.meal_items)::jsonb)
    ) THEN
      RAISE EXCEPTION 'Invalid meal_items structure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_glucose_readings_updated_at
  BEFORE UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER validate_meal_items_trigger
  BEFORE INSERT OR UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION validate_meal_items();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for glucose_readings
CREATE POLICY "Users can create their own glucose readings"
  ON glucose_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own glucose readings"
  ON glucose_readings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own glucose readings"
  ON glucose_readings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glucose readings"
  ON glucose_readings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_glucose_readings_user_timestamp 
  ON glucose_readings (user_id, timestamp DESC);