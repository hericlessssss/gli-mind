/*
  # Update meal types in glucose_readings table

  1. Changes
    - Update meal_type check constraint to include new meal types:
      - afternoon_snack (Lanche da tarde)
      - supper (Ceia)
      - post_supper (Pós ceia)

  2. Notes
    - Maintains existing data integrity
    - Updates constraint without dropping table
*/

-- First, drop the existing constraint
ALTER TABLE glucose_readings 
DROP CONSTRAINT IF EXISTS glucose_readings_meal_type_check;

-- Add the updated constraint with new meal types
ALTER TABLE glucose_readings 
ADD CONSTRAINT glucose_readings_meal_type_check 
CHECK (meal_type = ANY (ARRAY[
  'fasting',
  'pre_breakfast',
  'post_breakfast',
  'pre_lunch',
  'post_lunch',
  'afternoon_snack',
  'pre_dinner',
  'post_dinner',
  'supper',
  'post_supper',
  'bedtime'
]::text[]));