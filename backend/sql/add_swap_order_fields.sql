-- Migration: add app-based battery swap order / Pakasir payment fields.
-- Run manually if Sequelize sync({ alter: true }) is disabled.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS slot_id integer,
  ADD COLUMN IF NOT EXISTS fee integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_payment integer,
  ADD COLUMN IF NOT EXISTS payment_method character varying(255),
  ADD COLUMN IF NOT EXISTS payment_number text,
  ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS released_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS release_code character varying(255);

CREATE INDEX IF NOT EXISTS transactions_user_status_idx ON public.transactions (user_id, status);
CREATE INDEX IF NOT EXISTS transactions_station_slot_idx ON public.transactions (station_id, slot_id);
CREATE INDEX IF NOT EXISTS transactions_expired_at_idx ON public.transactions (expired_at);
