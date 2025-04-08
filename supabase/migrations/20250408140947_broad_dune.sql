/*
  # Add diabetes type to profiles

  1. Changes
    - Add diabetes_type column to profiles table
    - Add check constraint for valid diabetes types
    - Set default value to null (required during registration)

  2. Notes
    - Valid types: 'type1', 'type2', 'gestational', 'other'
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS diabetes_type text
CHECK (diabetes_type IN ('type1', 'type2', 'gestational', 'other'));