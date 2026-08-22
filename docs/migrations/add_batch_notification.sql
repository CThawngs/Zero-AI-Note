-- Batch email notification (2026-08-23) — DECISIONS.md §25
-- Legacy schema notebooks/sources/notes (đang chạy thật; projects/files/jobs chưa migrate)

-- 1. Gom N file đính kèm cùng 1 tin nhắn thành 1 batch (NULL = file lẻ)
alter table sources add column if not exists batch_group_id uuid;
create index if not exists idx_sources_batch_group on sources(batch_group_id)
  where batch_group_id is not null;

-- 2. Dedupe email: set NGAY LẬP TỨC trong transaction khi claim gửi (chống race 2 job)
alter table notebooks add column if not exists notification_sent_at timestamptz;
