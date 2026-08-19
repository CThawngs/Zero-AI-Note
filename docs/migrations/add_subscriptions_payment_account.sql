-- Migration: add payment_account_id to subscriptions (Zero Tracking realtime payee switch)
-- Idempotent: safe to re-run.

alter table if exists subscriptions
  add column if not exists payment_account_id text;

-- Index for tracing which payee handled a given subscription
create index if not exists idx_subscriptions_payment_account
  on subscriptions (payment_account_id);

comment on column subscriptions.payment_account_id is
  'Zero Tracking payment_account_id chosen at checkout; null = app default payee. Snapshot for traceability.';
