/*
  # Create Database Schema for Diabetes Management App

  1. New Tables
    - glucose_readings
      - id (uuid, primary key)
      - user_id (uuid, foreign key to profiles)
      - glucose_level (integer)
      - timestamp (timestamptz)
      - notes (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - insulin_applications
      - id (uuid, primary key)
      - user_id (uuid, foreign key to profiles)
      - insulin_type (text)
      - units (decimal)
      - timestamp (timestamptz)
      - notes (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - meals
      - id (uuid, primary key)
      - user_id (uuid, foreign key to profiles)
      - timestamp (timestamptz)
      - notes (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - meal_items
      - id (uuid, primary key)
      - meal_id (uuid, foreign key to meals)
      - name (text)
      - is_custom (boolean)
      - high_glycemic (boolean)
      - category (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    - Users can only access their own data

  3. Triggers
    - Automatic timestamps for created_at and updated_at
*/

-- Create glucose_readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  glucose_level integer NOT NULL CHECK (glucose_level > 0),
  timestamp timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

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

-- Create insulin_applications table
CREATE TABLE IF NOT EXISTS insulin_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insulin_type text NOT NULL CHECK (insulin_type IN ('rapid', 'basal')),
  units decimal NOT NULL CHECK (units > 0),
  timestamp timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insulin_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own insulin applications"
  ON insulin_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own insulin applications"
  ON insulin_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insulin applications"
  ON insulin_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insulin applications"
  ON insulin_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own meals"
  ON meals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own meals"
  ON meals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create meal_items table
CREATE TABLE IF NOT EXISTS meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  high_glycemic boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- Meal items are accessed through the meals table policies
CREATE POLICY "Users can manage meal items through meals"
  ON meal_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_items.meal_id
      AND meals.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER set_glucose_readings_updated_at
  BEFORE UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_insulin_applications_updated_at
  BEFORE UPDATE ON insulin_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_timestamp 
  ON glucose_readings(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_insulin_applications_user_timestamp 
  ON insulin_applications(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_meals_user_timestamp 
  ON meals(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal 
  ON meal_items(meal_id);