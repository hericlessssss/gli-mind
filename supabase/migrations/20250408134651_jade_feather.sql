/*
  # Add meal_type to glucose_readings table

  1. Changes
    - Add meal_type column to glucose_readings table
    - Add check constraint to ensure valid meal types
    - Set default value to 'fasting'

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE glucose_readings
ADD COLUMN IF NOT EXISTS meal_type text NOT NULL DEFAULT 'fasting'
CHECK (meal_type IN ('fasting', 'lunch', 'dinner', 'snack'));