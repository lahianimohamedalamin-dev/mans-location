-- ============================================================
-- SCRIPT COMPLET — Man's Location
-- À coller en une seule fois dans Supabase > SQL Editor > New query
-- puis cliquer Run
-- ============================================================


-- ============================================================
-- 1. CRÉATION / MISE À JOUR DES TABLES
-- ============================================================

-- Colonnes manquantes sur PROFILS
ALTER TABLE profils ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS snap     text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS reseaux  text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS iban     text;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS devise   text DEFAULT 'EUR';
ALTER TABLE profils ADD COLUMN IF NOT EXISTS docs     jsonb DEFAULT '[]';

-- Colonnes manquantes sur RETOURS
ALTER TABLE retours ADD COLUMN IF NOT EXISTS remise_retour numeric DEFAULT 0;

-- Colonnes manquantes sur VEHICULES
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS motorisation      text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS boite             text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS puissance_fiscale text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS location_min_48   boolean DEFAULT false;

-- Table CLIENTS (persistance réelle des fiches clients)
CREATE TABLE IF NOT EXISTS clients (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users NOT NULL,
  cle        text        NOT NULL,
  nom        text,
  tel        text,
  adresse    text,
  email      text,
  permis     text,
  docs       jsonb       DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, cle)
);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients (user_id);


-- ============================================================
-- 2. ACTIVATION RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE profils   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours   ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE amendes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. POLITIQUES RLS — ACCÈS PROPRIÉTAIRE
-- ============================================================

-- PROFILS
DROP POLICY IF EXISTS "profils_owner" ON profils;
CREATE POLICY "profils_owner" ON profils
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- VEHICULES
DROP POLICY IF EXISTS "vehicules_owner" ON vehicules;
CREATE POLICY "vehicules_owner" ON vehicules
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CONTRATS
DROP POLICY IF EXISTS "contrats_owner" ON contrats;
CREATE POLICY "contrats_owner" ON contrats
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RETOURS
DROP POLICY IF EXISTS "retours_owner" ON retours;
CREATE POLICY "retours_owner" ON retours
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DEPENSES
DROP POLICY IF EXISTS "depenses_owner" ON depenses;
CREATE POLICY "depenses_owner" ON depenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AMENDES
DROP POLICY IF EXISTS "amendes_owner" ON amendes;
CREATE POLICY "amendes_owner" ON amendes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CLIENTS
DROP POLICY IF EXISTS "clients_owner" ON clients;
CREATE POLICY "clients_owner" ON clients
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. POLITIQUES RLS — ACCÈS PUBLIC (vitrine)
-- ============================================================

-- Profils : lecture publique (nom, tel affichés sur la vitrine)
DROP POLICY IF EXISTS "profils_public_read" ON profils;
CREATE POLICY "profils_public_read" ON profils
  FOR SELECT USING (true);

-- Véhicules : lecture publique uniquement si publié
DROP POLICY IF EXISTS "vehicules_public_read" ON vehicules;
CREATE POLICY "vehicules_public_read" ON vehicules
  FOR SELECT USING (publie = true);

-- Contrats : lecture publique des dates (disponibilités vitrine)
DROP POLICY IF EXISTS "contrats_public_dispo" ON contrats;
CREATE POLICY "contrats_public_dispo" ON contrats
  FOR SELECT USING (true);

-- Questions : insertion publique (formulaire de contact vitrine) — lecture propriétaire uniquement
DROP POLICY IF EXISTS "questions_owner"         ON questions;
DROP POLICY IF EXISTS "questions_public_insert" ON questions;
DROP POLICY IF EXISTS "questions_public_read"   ON questions;

CREATE POLICY "questions_owner" ON questions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "questions_public_insert" ON questions
  FOR INSERT WITH CHECK (true);

-- SÉCURITÉ : la lecture publique est supprimée pour ne pas exposer
-- les messages privés des clients. Seul le propriétaire peut lire ses questions.


-- ============================================================
-- 5. RECHARGEMENT DU CACHE SCHEMA (obligatoire)
-- ============================================================
NOTIFY pgrst, 'reload schema';
