-- ============================================================
-- SCRIPT RLS (Row Level Security) — Man's Location
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- PROFILS
ALTER TABLE profils ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profils_owner" ON profils;
CREATE POLICY "profils_owner" ON profils
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- VEHICULES
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicules_owner" ON vehicules;
CREATE POLICY "vehicules_owner" ON vehicules
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CONTRATS
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contrats_owner" ON contrats;
CREATE POLICY "contrats_owner" ON contrats
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RETOURS
ALTER TABLE retours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retours_owner" ON retours;
CREATE POLICY "retours_owner" ON retours
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DEPENSES
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "depenses_owner" ON depenses;
CREATE POLICY "depenses_owner" ON depenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- QUESTIONS (lecture publique pour la vitrine, écriture publique pour les clients)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_owner" ON questions;
DROP POLICY IF EXISTS "questions_public_insert" ON questions;
DROP POLICY IF EXISTS "questions_public_read" ON questions;
-- Le loueur voit et gère ses questions
CREATE POLICY "questions_owner" ON questions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Les visiteurs (non connectés) peuvent soumettre une demande de location
CREATE POLICY "questions_public_insert" ON questions
  FOR INSERT WITH CHECK (true);
-- Les visiteurs peuvent lire les questions d'un loueur (vitrine)
CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);

-- AMENDES
ALTER TABLE amendes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "amendes_owner" ON amendes;
CREATE POLICY "amendes_owner" ON amendes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CLIENTS (si table existe)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
    EXECUTE 'ALTER TABLE clients ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "clients_owner" ON clients';
    EXECUTE 'CREATE POLICY "clients_owner" ON clients USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Colonnes manquantes éventuelles
ALTER TABLE retours ADD COLUMN IF NOT EXISTS remise_retour numeric DEFAULT 0;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS reseaux text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS docs jsonb DEFAULT '[]';
ALTER TABLE profils ADD COLUMN IF NOT EXISTS devise text DEFAULT 'EUR';
ALTER TABLE profils ADD COLUMN IF NOT EXISTS snap text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS iban text;

-- ============================================================
-- MIGRATION : Champs véhicule manquants (motorisation, boite, etc.)
-- ============================================================
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS motorisation      text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS boite             text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS puissance_fiscale text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS location_min_48   boolean DEFAULT false;

-- ============================================================
-- MIGRATION : Table clients persistante
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users NOT NULL,
  cle         text        NOT NULL,
  nom         text,
  tel         text,
  adresse     text,
  email       text,
  permis      text,
  docs        jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, cle)
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_owner" ON clients;
CREATE POLICY "clients_owner" ON clients
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients (user_id);

-- Recharge le cache schema Supabase (nécessaire après ajout de colonnes/tables)
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- LECTURE PUBLIQUE POUR LA VITRINE (clients sans compte)
-- ============================================================

-- Profils : lecture publique (pour afficher le nom, tel de la vitrine)
DROP POLICY IF EXISTS "profils_public_read" ON profils;
CREATE POLICY "profils_public_read" ON profils
  FOR SELECT USING (true);

-- Véhicules : lecture publique des véhicules publiés uniquement
DROP POLICY IF EXISTS "vehicules_public_read" ON vehicules;
CREATE POLICY "vehicules_public_read" ON vehicules
  FOR SELECT USING (publie = true);

-- Contrats : lecture publique des dates uniquement (pour les disponibilités vitrine)
-- Seuls vehicle_id, date_debut, date_fin sont sélectionnés côté frontend — pas d'info client
DROP POLICY IF EXISTS "contrats_public_dispo" ON contrats;
CREATE POLICY "contrats_public_dispo" ON contrats
  FOR SELECT USING (true);

-- Questions : insertion publique (clients vitrine peuvent envoyer une demande)
DROP POLICY IF EXISTS "questions_public_insert" ON questions;
CREATE POLICY "questions_public_insert" ON questions
  FOR INSERT WITH CHECK (true);
