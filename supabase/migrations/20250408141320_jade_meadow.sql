/*
  # Reset Database

  1. Changes
    - Delete all data from tables while preserving structure
    - Reset in correct order to handle foreign key constraints

  2. Notes
    - Preserves table structure and policies
    - Safe cascade delete through foreign key relationships
*/

-- Delete data from tables in correct order
DELETE FROM meal_items;
DELETE FROM meals;
DELETE FROM insulin_applications;
DELETE FROM glucose_readings;
DELETE FROM glicemia_registros;
DELETE FROM profiles;

-- Reset users (through Supabase auth)
SELECT * FROM auth.users; -- This is just to check, actual deletion happens through auth API