-- Migration: add charging_sessions table for QR scan charging flow.
-- Run this on existing PostgreSQL databases if you do not use Sequelize sync({ alter: true }).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_charging_sessions_status') THEN
    CREATE TYPE public.enum_charging_sessions_status AS ENUM (
      'pending',
      'charging',
      'completed',
      'failed',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.charging_sessions (
  session_id character varying(255) NOT NULL,
  user_id integer NOT NULL,
  user_name character varying(255),
  cable_id character varying(255) NOT NULL,
  cable_name character varying(255),
  station_id character varying(255),
  station_name character varying(255),
  amount integer NOT NULL,
  requested_watt integer NOT NULL,
  estimated_kwh numeric(10,3) DEFAULT 0 NOT NULL,
  price_per_kwh integer DEFAULT 2500 NOT NULL,
  qr_token_snapshot character varying(255),
  status public.enum_charging_sessions_status DEFAULT 'charging'::public.enum_charging_sessions_status NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT charging_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT charging_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT charging_sessions_cable_id_fkey FOREIGN KEY (cable_id) REFERENCES public.batteries(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT charging_sessions_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS charging_sessions_user_id ON public.charging_sessions (user_id);
CREATE INDEX IF NOT EXISTS charging_sessions_cable_id ON public.charging_sessions (cable_id);
CREATE INDEX IF NOT EXISTS charging_sessions_status ON public.charging_sessions (status);
CREATE INDEX IF NOT EXISTS charging_sessions_started_at ON public.charging_sessions (started_at);
