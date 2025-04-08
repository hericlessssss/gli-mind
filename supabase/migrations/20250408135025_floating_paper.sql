/*
  # Create Glucose Records Table

  1. New Tables
    - `glicemia_registros`
      - `id` (uuid, primary key)
      - `valor_glicemia` (integer)
      - `horario_medicao` (timestamp with time zone)
      - `tipo_refeicao` (text with check constraint)
      - `observacoes` (text, nullable)
      - `alerta_insulina` (text)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own records
*/

CREATE TABLE IF NOT EXISTS glicemia_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  valor_glicemia integer NOT NULL CHECK (valor_glicemia > 0),
  horario_medicao timestamptz NOT NULL DEFAULT now(),
  tipo_refeicao text NOT NULL CHECK (tipo_refeicao IN ('Jejum', 'Pré-Almoço', 'Pós-Almoço', 'Lanche', 'Jantar', 'Ceia')),
  observacoes text,
  alerta_insulina text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE glicemia_registros ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own glucose records"
  ON glicemia_registros
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own glucose records"
  ON glicemia_registros
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_glicemia_registros_user_horario
  ON glicemia_registros (user_id, horario_medicao DESC);