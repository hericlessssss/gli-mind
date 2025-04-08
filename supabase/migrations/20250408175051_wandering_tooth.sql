/*
  # Create Custom Foods Table

  1. New Tables
    - `custom_foods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `category` (text)
      - `high_glycemic` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Read their own custom foods
      - Create custom foods
*/

CREATE TABLE IF NOT EXISTS custom_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  high_glycemic boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own custom foods"
  ON custom_foods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom foods"
  ON custom_foods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_custom_foods_user_id 
  ON custom_foods(user_id);