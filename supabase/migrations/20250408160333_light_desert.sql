/*
  # Create Unified Tracking System

  1. New Tables
    - `glucose_readings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `glucose_level` (integer)
      - `timestamp` (timestamptz)
      - `meal_type` (text with check constraint)
      - `insulin_applied` (boolean)
      - `insulin_units` (numeric)
      - `meal_items` (jsonb[])
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own records
*/

-- Create glucose_readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
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

-- Enable RLS
ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create validation function for meal_items
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

-- Create trigger for meal_items validation
CREATE TRIGGER validate_meal_items_trigger
  BEFORE INSERT OR UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION validate_meal_items();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_timestamp 
  ON glucose_readings (user_id, timestamp DESC);