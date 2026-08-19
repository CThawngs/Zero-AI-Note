-- Ràng buộc: 1 tài khoản chỉ được nhập đúng 1 mã coupon duy nhất (không trùng).
-- Mỗi user_id là PRIMARY KEY -> chỉ lưu được 1 coupon_code duy nhất.
-- Khi user Active một mã thành công, bản ghi được tạo; lần sau truy cập
-- bất kỳ mã nào cũng bị từ chối (duplicate key violation hoặc check trước).

create table if not exists user_coupons (
  user_id     uuid        not null references profiles(id) on delete cascade,
  coupon_code text        not null,
  used_at     timestamptz not null default now(),
  primary key (user_id)
);

-- Index phụ phòng truy vấn ngược (hiếm dùng nhưng an toàn)
create index if not exists idx_user_coupons_code on user_coupons (coupon_code);
