/*
  # Add name fields to profiles table

  1. Changes
    - Add first_name and last_name columns to profiles table
    - Make both columns nullable initially to maintain compatibility with existing records
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;