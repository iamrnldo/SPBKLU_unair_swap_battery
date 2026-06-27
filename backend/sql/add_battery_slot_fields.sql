-- Migration: add battery swap slot fields to the legacy batteries table.
-- Run this on existing PostgreSQL databases if you do not use Sequelize sync({ alter: true }).

ALTER TABLE public.batteries
  ADD COLUMN IF NOT EXISTS name character varying(255),
  ADD COLUMN IF NOT EXISTS power_watt integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS price_per_kwh integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS slot_id integer,
  ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
  ADD COLUMN IF NOT EXISTS longitude numeric(11,8),
  ADD COLUMN IF NOT EXISTS location_note text;

CREATE INDEX IF NOT EXISTS batteries_latitude_longitude_idx ON public.batteries (latitude, longitude);
CREATE INDEX IF NOT EXISTS batteries_current_station_id_idx ON public.batteries (current_station_id);
CREATE INDEX IF NOT EXISTS batteries_current_station_slot_idx ON public.batteries (current_station_id, slot_id);

-- Optional: initialize display names for old rows.
UPDATE public.batteries SET name = id WHERE name IS NULL;
