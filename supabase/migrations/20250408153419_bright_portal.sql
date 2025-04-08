/*
  # Update glucose readings table schema

  1. Changes
    - Add new columns for insulin tracking and meal items
    - Update meal type options
    - Add appropriate constraints

  2. New Columns
    - `insulin_applied` (boolean) - Whether insulin was applied
    - `insulin_units` (numeric) - Number of insulin units applied
    - `meal_items` (jsonb[]) - Array of meal items consumed

  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to glucose_readings
ALTER TABLE glucose_readings 
ADD COLUMN IF NOT EXISTS insulin_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS insulin_units numeric CHECK (insulin_units > 0 AND insulin_units <= 10),
ADD COLUMN IF NOT EXISTS meal_items jsonb[];

-- Update meal_type check constraint
ALTER TABLE glucose_readings DROP CONSTRAINT IF EXISTS glucose_readings_meal_type_check;
ALTER TABLE glucose_readings ADD CONSTRAINT glucose_readings_meal_type_check 
  CHECK (meal_type = ANY (ARRAY['fasting'::text, 'pre_breakfast'::text, 'post_breakfast'::text, 'pre_lunch'::text, 'post_lunch'::text, 'pre_dinner'::text, 'post_dinner'::text, 'bedtime'::text]));

-- Create validation function for meal_items
CREATE OR REPLACE FUNCTION validate_meal_items()
RETURNS trigger AS $$
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
DROP TRIGGER IF EXISTS validate_meal_items_trigger ON glucose_readings;
CREATE TRIGGER validate_meal_items_trigger
  BEFORE INSERT OR UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION validate_meal_items();