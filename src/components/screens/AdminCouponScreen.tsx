import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Ticket, 
  BarChart3, 
  Settings, 
  Users,
  LayoutDashboard,
  Percent,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CouponItem } from '../../types';
import { Modal } from '../common/Modal';

export const AdminCouponScreen: React.FC = () => {
  const { 
    coupons, 
    addCoupon, 
    updateCoupon, 
    deleteCoupon, 
    setCurrentScreen, 
    addToast,
    theme,
    language,
    t
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<CouponItem | null>(null);

  // Form states for Create/Edit
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number>(20);
  const [formAppliedTo, setFormAppliedTo] = useState<'all' | 'paid' | 'pro'>('all');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('100');
  const [formExpiryDate, setFormExpiryDate] = useState('31/12/2026');
  const [formStatus, setFormStatus] = useState<'active' | 'expired' | 'disabled'>('active');

  const isDark = theme === 'dark';

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(20);
    setFormAppliedTo('all');
    setFormUsageLimit('100');
    setFormExpiryDate('31/12/2026');
    setFormStatus('active');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormAppliedTo(coupon.appliedTo);
    setFormUsageLimit(coupon.usageLimit !== null ? String(coupon.usageLimit) : '');
    setFormExpiryDate(coupon.expiryDate);
    setFormStatus(coupon.status);
    setIsCreateModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const limitVal = formUsageLimit.trim() ? parseInt(formUsageLimit, 10) : null;

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, {
        code: formCode.trim().toUpperCase(),
        type: formType,
        value: Number(formValue),
        appliedTo: formAppliedTo,
        usageLimit: limitVal,
        expiryDate: formExpiryDate.trim() || (language === 'vi' ? 'Không giới hạn' : 'Unlimited'),
        status: formStatus
      });
    } else {
      addCoupon({
        code: formCode.trim().toUpperCase(),
        type: formType,
        value: Number(formValue),
        appliedTo: formAppliedTo,
        usageLimit: limitVal,
        expiryDate: formExpiryDate.trim() || (language === 'vi' ? 'Không giới hạn' : 'Unlimited'),
        status: formStatus
      });
    }

    setIsCreateModalOpen(false);
  };

  const filteredCoupons = coupons.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.code.toLowerCase().includes(q) || c.appliedTo.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>{language === 'vi' ? 'Đang hoạt động' : 'Active'}</span>
        </span>
      );
    }
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          <span>{language === 'vi' ? 'Hết hạn' : 'Expired'}</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200'
      }`}>
        <XCircle className="w-3 h-3" />
        <span>{language === 'vi' ? 'Đã tắt' : 'Disabled'}</span>
      </span>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
      isDark ? 'bg-[#1F1B18] text-[#F7F4EE]' : 'bg-[#FAF7F2] text-[#26221D]'
    }`}>
      {/* Top Admin Navigation Banner */}
      <div className={`h-12 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors ${
        isDark ? 'bg-[#24201C] border-[#38322B]' : 'bg-[#F4EFE6] border-[#E6E0D6]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
            {language === 'vi' ? 'Cổng Quản Trị Hệ Thống (Admin Portal)' : 'Admin Management Portal'}
          </span>
        </div>

        <button
          id="btn-return-to-app"
          onClick={() => setCurrentScreen('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border active:scale-95 ${
            isDark ? 'bg-[#322B24] hover:bg-[#3D352D] border-[#443C32] text-[#D8D2C9] hover:text-white' : 'bg-white hover:bg-[#FAF7F2] border-[#E2DBD0] text-[#4A4239] shadow-2xs'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? '← Quay lại Ứng dụng' : '← Back to App'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Left Sidebar */}
        <aside className={`w-56 border-r p-4 flex-col justify-between hidden md:flex shrink-0 transition-colors ${
          isDark ? 'border-[#38322B] bg-[#24201C]' : 'border-[#E6E0D6] bg-white'
        }`}>
          <div className="space-y-1">
            <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`}>
              {language === 'vi' ? 'Menu Quản Trị' : 'Admin Navigation'}
            </div>
            {[
              { label: language === 'vi' ? 'Bảng điều khiển' : 'Dashboard', icon: LayoutDashboard, active: false },
              { label: language === 'vi' ? 'Mã Coupon' : 'Coupons & Promos', icon: Ticket, active: true },
              { label: language === 'vi' ? 'Thống kê Doanh thu' : 'Revenue Metrics', icon: BarChart3, active: false },
              { label: language === 'vi' ? 'Người dùng' : 'User Accounts', icon: Users, active: false },
              { label: language === 'vi' ? 'Cấu hình chung' : 'Configuration', icon: Settings, active: false }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
                    item.active
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : isDark ? 'text-[#A8A199] hover:text-white hover:bg-[#322B24]' : 'text-[#6E665D] hover:text-[#26221D] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-amber-500' : isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className={`p-3 rounded-xl border text-xs ${
            isDark ? 'bg-[#26211C] border-[#38322B] text-[#A8A199]' : 'bg-[#FAF7F2] border-[#E2DBD0] text-[#6E665D]'
          }`}>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-[#26221D]'}`}>{language === 'vi' ? 'Chế độ Quản trị' : 'Admin Mode'}</p>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`}>{language === 'vi' ? 'Quyền: SuperAdmin' : 'Role: SuperAdmin'}</p>
          </div>
        </aside>

        {/* Admin Main Body */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Controls */}
          <div className={`p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors ${
            isDark ? 'border-[#38322B] bg-[#24201C]/80' : 'border-[#E6E0D6] bg-white'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
                  {language === 'vi' ? 'Quản Lý Coupon Giảm Giá' : 'Coupon Campaign Management'}
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                  {language === 'vi' 
                    ? 'Tạo mới, theo dõi số lượt sử dụng và điều chỉnh thời hạn mã khuyến mại' 
                    : 'Create promotional vouchers, track redemption counts, and adjust expiry rules'}
                </p>
              </div>

              <button
                id="btn-open-create-coupon"
                onClick={openCreateModal}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'vi' ? '+ Tạo Coupon mới' : '+ Create New Coupon'}</span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#8C857B]' : 'text-[#9E958A]'}`} />
                <input
                  id="input-search-coupons"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'vi' ? 'Tìm kiếm mã coupon, đối tượng áp dụng...' : 'Search coupons, plan targets...'}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white placeholder-[#8A8177]' : 'bg-[#FAF7F2] border-[#E2DBD0] text-[#26221D] placeholder-[#9E958A]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                {[
                  { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { id: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
                  { id: 'expired', label: language === 'vi' ? 'Hết hạn' : 'Expired' },
                  { id: 'disabled', label: language === 'vi' ? 'Đã tắt' : 'Disabled' }
                ].map((s) => (
                  <button
                    key={s.id}
                    id={`filter-coupon-status-${s.id}`}
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border whitespace-nowrap active:scale-95 ${
                      statusFilter === s.id
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                        : isDark ? 'border-transparent text-[#A8A199] hover:text-white' : 'border-transparent text-[#6E665D] hover:text-[#26221D]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="md:hidden flex items-center justify-between text-[11px] text-[#8C857B] mb-2 px-1">
              <span>{language === 'vi' ? '← Vuốt sang ngang để xem đầy đủ cột' : '← Swipe horizontally to see all columns'}</span>
              <span className="text-[10px] font-mono bg-[#322B24] px-1.5 py-0.5 rounded text-[#D8D2C9]">{filteredCoupons.length} coupons</span>
            </div>

            <div className={`rounded-2xl border overflow-x-auto custom-scrollbar ${
              isDark ? 'border-[#38322B] bg-[#26211C]' : 'border-[#E6E0D6] bg-white shadow-xs'
            }`}>
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className={`border-b font-semibold uppercase text-[10px] tracking-wider ${
                  isDark ? 'bg-[#24201C] border-[#38322B] text-[#A8A199]' : 'bg-[#FAF7F2] border-[#E6E0D6] text-[#6E665D]'
                }`}>
                  <tr>
                    <th className="px-5 py-3.5">{language === 'vi' ? 'Mã Coupon' : 'Code'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Loại & Giá Trị' : 'Type & Value'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Áp Dụng Cho' : 'Target Plan'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Lượt Dùng / Giới Hạn' : 'Usage / Limit'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Ngày Hết Hạn' : 'Expiry'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                    <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#38322B] text-[#D8D2C9]' : 'divide-[#EAE4D9] text-[#4A4239]'}`}>
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`px-5 py-8 text-center ${isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`}>
                        {language === 'vi' ? 'Không tìm thấy coupon nào.' : 'No coupons match filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className={isDark ? 'hover:bg-[#322B24]/40 transition-colors' : 'hover:bg-[#FAF7F2] transition-colors'}>
                        {/* Code */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className={`font-mono font-bold text-sm tracking-wide ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
                              {coupon.code}
                            </span>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-emerald-500">
                            {coupon.type === 'percentage'
                              ? `${language === 'vi' ? 'Giảm' : 'Off'} ${coupon.value}%`
                              : `${language === 'vi' ? 'Giảm' : 'Off'} ${coupon.value.toLocaleString('vi-VN')}đ`}
                          </span>
                        </td>

                        {/* Applied to */}
                        <td className="px-4 py-3.5 capitalize font-medium whitespace-nowrap">
                          {coupon.appliedTo === 'all'
                            ? (language === 'vi' ? 'Tất cả các gói' : 'All Plans')
                            : coupon.appliedTo === 'pro'
                            ? (language === 'vi' ? 'Gói Pro' : 'Pro Plan')
                            : (language === 'vi' ? 'Gói Paid' : 'Paid Tiers')}
                        </td>

                        {/* Used count */}
                        <td className="px-4 py-3.5 font-mono text-[11px] whitespace-nowrap">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-[#26221D]'}`}>{coupon.usedCount}</span>
                          <span className={isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}>
                            {' '}
                            / {coupon.usageLimit !== null ? coupon.usageLimit : (language === 'vi' ? '∞ Không giới hạn' : '∞ Unlimited')}
                          </span>
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-3.5 text-[#8C857B] whitespace-nowrap">
                          {coupon.expiryDate}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(coupon.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-edit-coupon-${coupon.id}`}
                              onClick={() => openEditModal(coupon)}
                              className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 ${
                                isDark ? 'text-[#A8A199] hover:text-amber-400 hover:bg-[#322B24]' : 'text-[#6E665D] hover:text-amber-600 hover:bg-[#FAF7F2]'
                              }`}
                              title={language === 'vi' ? 'Chỉnh sửa coupon' : 'Edit coupon'}
                              aria-label="Edit coupon"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-coupon-${coupon.id}`}
                              onClick={() => setDeleteConfirmCoupon(coupon)}
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8C857B] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer active:scale-95"
                              title={language === 'vi' ? 'Xóa coupon' : 'Delete coupon'}
                              aria-label="Delete coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingCoupon ? `${language === 'vi' ? 'Chỉnh sửa Coupon:' : 'Edit Coupon:'} ${editingCoupon.code}` : (language === 'vi' ? 'Tạo Coupon Giảm Giá Mới' : 'Create New Promo Coupon')}
          subtitle={language === 'vi' ? 'Thiết lập các thông số giảm giá, giới hạn lượt dùng và thời hạn hiệu lực' : 'Configure promo rules, maximum redemption limits, and validity period'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveCoupon} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                {language === 'vi' ? 'Mã Code Coupon' : 'Promo Code'} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-coupon-code"
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="VD: PROMO2026"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs uppercase font-mono focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Loại giảm giá' : 'Discount Type'}
                </label>
                <select
                  id="select-coupon-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                >
                  <option value="percentage">{language === 'vi' ? 'Phần trăm (%)' : 'Percentage (%)'}</option>
                  <option value="fixed">{language === 'vi' ? 'Số tiền cố định (VNĐ)' : 'Fixed Amount (VND)'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Giá trị giảm' : 'Discount Value'} ({formType === 'percentage' ? '%' : 'VNĐ'}) <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-coupon-value"
                  type="number"
                  required
                  min={1}
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Áp dụng cho' : 'Applied To'}
                </label>
                <select
                  id="select-coupon-applied-to"
                  value={formAppliedTo}
                  onChange={(e) => setFormAppliedTo(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                >
                  <option value="all">{language === 'vi' ? 'Tất cả các gói' : 'All Plans'}</option>
                  <option value="pro">{language === 'vi' ? 'Chỉ Gói Pro' : 'Pro Plan Only'}</option>
                  <option value="paid">{language === 'vi' ? 'Các gói trả phí' : 'Paid Plans'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Giới hạn số lượt dùng' : 'Usage Limit'}
                </label>
                <input
                  id="input-coupon-limit"
                  type="number"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="100"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Ngày hết hạn' : 'Expiry Date'}
                </label>
                <input
                  id="input-coupon-expiry"
                  type="text"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  placeholder="31/12/2026"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <select
                  id="select-coupon-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#26211C] border-[#38322B] text-white' : 'bg-white border-[#E2DBD0] text-[#26221D]'
                  }`}
                >
                  <option value="active">{language === 'vi' ? 'Đang hoạt động' : 'Active'}</option>
                  <option value="expired">{language === 'vi' ? 'Hết hạn' : 'Expired'}</option>
                  <option value="disabled">{language === 'vi' ? 'Tạm tắt' : 'Disabled'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[#322B24] text-[#D8D2C9] hover:bg-[#3D352D]' : 'bg-[#EAE4D9] text-[#4A4239] hover:bg-[#DDD5C8]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                id="btn-save-coupon-submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/25 cursor-pointer active:scale-95"
              >
                {editingCoupon ? (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes') : (language === 'vi' ? 'Tạo Coupon' : 'Create Coupon')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Coupon Confirmation Modal */}
      {deleteConfirmCoupon && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmCoupon(null)}
          title={language === 'vi' ? 'Xác nhận xóa Coupon' : 'Delete Coupon Confirmation'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className={`text-xs ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
              {language === 'vi' ? 'Bạn có chắc chắn muốn xóa vĩnh viễn mã coupon ' : 'Are you sure you want to delete promo coupon '}
              <strong className={`font-mono ${isDark ? 'text-white' : 'text-[#26221D]'}`}>{deleteConfirmCoupon.code}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCoupon(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[#322B24] text-[#D8D2C9] hover:bg-[#3D352D]' : 'bg-[#EAE4D9] text-[#4A4239] hover:bg-[#DDD5C8]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-coupon"
                onClick={() => {
                  deleteCoupon(deleteConfirmCoupon.id);
                  setDeleteConfirmCoupon(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
              >
                {language === 'vi' ? 'Xóa Coupon' : 'Delete Coupon'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
