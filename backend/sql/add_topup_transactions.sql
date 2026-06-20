-- Migration: add wallet top-up table for Pakasir QRIS payments
-- Run this on existing PostgreSQL databases if you do not use Sequelize sync({ alter: true }).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_topup_transactions_status') THEN
    CREATE TYPE public.enum_topup_transactions_status AS ENUM (
      'pending',
      'completed',
      'failed',
      'cancelled',
      'expired'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.topup_transactions (
  order_id character varying(255) NOT NULL,
  user_id integer NOT NULL,
  amount integer NOT NULL,
  fee integer DEFAULT 0 NOT NULL,
  total_payment integer NOT NULL,
  payment_method character varying(255) DEFAULT 'qris' NOT NULL,
  payment_number text NOT NULL,
  status public.enum_topup_transactions_status DEFAULT 'pending'::public.enum_topup_transactions_status NOT NULL,
  expired_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT topup_transactions_pkey PRIMARY KEY (order_id),
  CONSTRAINT topup_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS topup_transactions_user_id ON public.topup_transactions (user_id);
CREATE INDEX IF NOT EXISTS topup_transactions_status ON public.topup_transactions (status);
CREATE INDEX IF NOT EXISTS topup_transactions_created_at ON public.topup_transactions (created_at);
