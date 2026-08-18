import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
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
    setCoupons,
    setCurrentScreen,
    addToast,
    theme,
    language,
    t
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'discount-high' | 'code-az'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<CouponItem | null>(null);

  // Form states for Create/Edit
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
  const [formValue, setFormValue] = useState<number>(20);
  const [formAppliedTo, setFormAppliedTo] = useState<'all' | 'paid' | 'pro'>('all');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('100');
  const [formExpiryDate, setFormExpiryDate] = useState('31/12/2026');
  const [formStatus, setFormStatus] = useState<'active' | 'expired' | 'disabled'>('active');

  const isDark = theme === 'dark';

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percent');
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
      setFormType(coupon.discount_type ?? 'percent');
      setFormValue(coupon.discount_value ?? 0);
      setFormAppliedTo(coupon.applies_to ?? 'all');
      setFormUsageLimit(coupon.usage_limit !== null ? String(coupon.usage_limit) : '');
      setFormExpiryDate(coupon.expires_at ?? '');
      setFormStatus(coupon.status);
      setIsCreateModalOpen(true);
    };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const limitVal = formUsageLimit.trim() ? parseInt(formUsageLimit, 10) : null;

    try {
      const response = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCoupon?.id,
          code: formCode.trim().toUpperCase(),
          discount_type: formType,
          discount_value: Number(formValue),
          applies_to: formAppliedTo,
          usage_limit: limitVal,
          expires_at: formExpiryDate.trim() || null,
          status: formStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save coupon');
      }

      // Refresh coupons list
      const couponsResponse = await fetch('/api/admin/coupons');
      const couponsData = await couponsResponse.json();
      if (couponsData.coupons) {
        setCoupons(couponsData.coupons);
      }

      setIsCreateModalOpen(false);
      addToast(
        language === 'vi' ? 'Lưu thành công' : 'Saved successfully',
        language === 'vi' ? 'Mã giảm giá đã được cập nhật.' : 'Coupon updated successfully.'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi lưu Coupon' : 'Save failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteConfirmCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons?id=${deleteConfirmCoupon.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to delete coupon');
      }

      // Refresh coupons list
      const couponsResponse = await fetch('/api/admin/coupons');
      const couponsData = await couponsResponse.json();
      if (couponsData.coupons) {
        setCoupons(couponsData.coupons);
      }

      setDeleteConfirmCoupon(null);
      addToast(
        language === 'vi' ? 'Đã xoá Coupon' : 'Coupon Deleted',
        language === 'vi' ? 'Mã giảm giá đã được gỡ.' : 'Coupon removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xoá Coupon' : 'Delete failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  let filteredCoupons = coupons.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.code.toLowerCase().includes(q) ||
        (c.applies_to ?? '').toLowerCase().includes(q) ||
        String(c.discount_value ?? '').includes(q)
      );
    }
    return true;
  });

  filteredCoupons = [...filteredCoupons].sort((a, b) => {
    if (sortOption === 'code-az') return a.code.localeCompare(b.code);
    if (sortOption === 'discount-high') return (b.discount_value || 0) - (a.discount_value || 0);
    if (sortOption === 'oldest') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }
    // Default 'newest'
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>{language === 'vi' ? 'Đang hoạt động' : 'Active'}</span>
        </span>
      );
    }
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
          <Clock className="w-3 h-3" />
          <span>{language === 'vi' ? 'Hết hạn' : 'Expired'}</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200'
      }`}>
        <XCircle className="w-3 h-3" />
        <span>{language === 'vi' ? 'Đã tắt' : 'Disabled'}</span>
      </span>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Top Admin Navigation Banner */}
      <div className={`h-12 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors ${
        isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${'text-[var(--text-primary)]'}`}>
            {language === 'vi' ? 'Cổng Quản Trị Hệ Thống (Admin Portal)' : 'Admin Management Portal'}
          </span>
        </div>

        <button
          id="btn-return-to-app"
          onClick={() => setCurrentScreen('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border active:scale-95 ${
            isDark ? 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'bg-white hover:bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] shadow-2xs'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? '← Quay lại Ứng dụng' : '← Back to App'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Left Sidebar */}
        <aside className={`w-56 border-r p-4 flex-col justify-between hidden md:flex shrink-0 transition-colors ${
          isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-white'
        }`}>
          <div className="space-y-1">
            <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>
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
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                      : isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-[var(--accent-primary)]' : isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className={`p-3 rounded-xl border text-xs ${
            isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]'
          }`}>
            <p className={`font-bold ${'text-[var(--text-primary)]'}`}>{language === 'vi' ? 'Chế độ Quản trị' : 'Admin Mode'}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>{language === 'vi' ? 'Quyền: SuperAdmin' : 'Role: SuperAdmin'}</p>
          </div>
        </aside>

        {/* Admin Main Body */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Controls */}
          <div className={`p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors ${
            isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]/80' : 'border-[var(--border-color)] bg-white'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${'text-[var(--text-primary)]'}`}>
                  {language === 'vi' ? 'Quản Lý Coupon Giảm Giá' : 'Coupon Campaign Management'}
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' 
                    ? 'Tạo mới, theo dõi số lượt sử dụng và điều chỉnh thời hạn mã khuyến mại' 
                    : 'Create promotional vouchers, track redemption counts, and adjust expiry rules'}
                </p>
              </div>

              <button
                id="btn-open-create-coupon"
                onClick={openCreateModal}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)] hover:from-[var(--accent-primary)] hover:to-[var(--accent-primary)] text-[var(--accent-text)] rounded-xl text-xs font-bold shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'vi' ? '+ Tạo Coupon mới' : '+ Create New Coupon'}</span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`} />
                <input
                  id="input-search-coupons"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'vi' ? 'Tìm kiếm mã coupon, đối tượng áp dụng...' : 'Search coupons, plan targets...'}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
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
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 shadow-2xs'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    id="coupon-sort-btn"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>
                      {sortOption === 'newest' 
                        ? (language === 'vi' ? 'Mới nhất' : 'Newest') 
                        : sortOption === 'discount-high' 
                        ? (language === 'vi' ? 'Giảm cao nhất' : 'Max Discount')
                        : sortOption === 'code-az' 
                        ? (language === 'vi' ? 'Mã A → Z' : 'Code A → Z')
                        : (language === 'vi' ? 'Cũ nhất' : 'Oldest')}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isSortDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.96, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 4 }}
                          className="absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                        >
                          {[
                            { id: 'newest', label: language === 'vi' ? 'Mới nhất' : 'Newest' },
                            { id: 'discount-high', label: language === 'vi' ? 'Giảm nhiều nhất' : 'Highest Discount' },
                            { id: 'code-az', label: language === 'vi' ? 'Mã A → Z' : 'Code A → Z' },
                            { id: 'oldest', label: language === 'vi' ? 'Cũ nhất' : 'Oldest' }
                          ].map(s => (
                            <button
                              key={s.id}
                              id={`sort-coupon-${s.id}`}
                              onClick={() => {
                                setSortOption(s.id as any);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                sortOption === s.id 
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold' 
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="md:hidden flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 px-1">
              <span>{language === 'vi' ? '← Vuốt sang ngang để xem đầy đủ cột' : '← Swipe horizontally to see all columns'}</span>
              <span className="text-xs font-mono bg-[var(--bg-hover)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">{filteredCoupons.length} coupons</span>
            </div>

            <div className={`rounded-2xl border overflow-x-auto custom-scrollbar ${
              isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-white shadow-xs'
            }`}>
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className={`border-b font-semibold uppercase text-xs tracking-wider ${
                  isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]'
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
                <tbody className={`divide-y ${isDark ? 'divide-[var(--border-color)] text-[var(--text-secondary)]' : 'divide-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`px-5 py-8 text-center ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>
                        {language === 'vi' ? 'Không tìm thấy coupon nào.' : 'No coupons match filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className={isDark ? 'hover:bg-[var(--bg-hover)]/40 transition-colors' : 'hover:bg-[var(--bg-app)] transition-colors'}>
                        {/* Code */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                            <span className={`font-mono font-bold text-sm tracking-wide ${'text-[var(--text-primary)]'}`}>
                              {coupon.code}
                            </span>
                          </div>
                        </td>

                        {/* Value */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                  <span className="font-bold text-[var(--status-success)]">
                                                    {coupon.discount_type === 'percent'
                                                      ? `${language === 'vi' ? 'Giảm' : 'Off'} ${coupon.discount_value}%`
                                                      : `${language === 'vi' ? 'Giảm' : 'Off'} ${Number(coupon.discount_value ?? 0).toLocaleString('vi-VN')}đ`}
                                                  </span>
                                                </td>

                                                {/* Applied to */}
                                                <td className="px-4 py-3.5 capitalize font-medium whitespace-nowrap">
                                                  {(coupon.applies_to ?? 'all') === 'all'
                                                    ? (language === 'vi' ? 'Tất cả các gói' : 'All Plans')
                                                    : (coupon.applies_to ?? '') === 'pro'
                                                    ? (language === 'vi' ? 'Gói Pro' : 'Pro Plan')
                                                    : (language === 'vi' ? 'Gói Paid' : 'Paid Tiers')}
                                                </td>

                                                {/* Used count */}
                                                <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                                                  <span className={`font-bold ${'text-[var(--text-primary)]'}`}>{coupon.usage_count ?? 0}</span>
                                                  <span className={isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}>
                                                    {' '}
                                                    / {coupon.usage_limit !== null ? coupon.usage_limit : (language === 'vi' ? '∞ Không giới hạn' : '∞ Unlimited')}
                                                  </span>
                                                </td>

                                                {/* Expiry */}
                                                <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                                                  {coupon.expires_at ?? (language === 'vi' ? 'Không giới hạn' : 'Unlimited')}
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
                                isDark ? 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-app)]'
                              }`}
                              title={language === 'vi' ? 'Chỉnh sửa coupon' : 'Edit coupon'}
                              aria-label="Edit coupon"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-coupon-${coupon.id}`}
                              onClick={() => setDeleteConfirmCoupon(coupon)}
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 rounded-xl transition-colors cursor-pointer active:scale-95"
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
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                {language === 'vi' ? 'Mã Code Coupon' : 'Promo Code'} <span className="text-[var(--status-error)]">*</span>
              </label>
              <input
                id="input-coupon-code"
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="VD: PROMO2026"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs uppercase font-mono focus:outline-none focus:border-[var(--accent-primary)] ${
                  isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Loại giảm giá' : 'Discount Type'}
                </label>
                <select
                  id="select-coupon-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  <option value="percentage">{language === 'vi' ? 'Phần trăm (%)' : 'Percentage (%)'}</option>
                  <option value="fixed">{language === 'vi' ? 'Số tiền cố định (VNĐ)' : 'Fixed Amount (VND)'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Giá trị giảm' : 'Discount Value'} ({formType === 'percent' ? '%' : 'VNĐ'}) <span className="text-[var(--status-error)]">*</span>
                </label>
                <input
                  id="input-coupon-value"
                  type="number"
                  required
                  min={1}
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Áp dụng cho' : 'Applied To'}
                </label>
                <select
                  id="select-coupon-applied-to"
                  value={formAppliedTo}
                  onChange={(e) => setFormAppliedTo(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  <option value="all">{language === 'vi' ? 'Tất cả các gói' : 'All Plans'}</option>
                  <option value="pro">{language === 'vi' ? 'Chỉ Gói Pro' : 'Pro Plan Only'}</option>
                  <option value="paid">{language === 'vi' ? 'Các gói trả phí' : 'Paid Plans'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Giới hạn số lượt dùng' : 'Usage Limit'}
                </label>
                <input
                  id="input-coupon-limit"
                  type="number"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="100"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Ngày hết hạn' : 'Expiry Date'}
                </label>
                <input
                  id="input-coupon-expiry"
                  type="text"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  placeholder="31/12/2026"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <select
                  id="select-coupon-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
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
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                id="btn-save-coupon-submit"
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md shadow-[var(--accent-primary)]/25 cursor-pointer active:scale-95"
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
            <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Bạn có chắc chắn muốn xóa vĩnh viễn mã coupon ' : 'Are you sure you want to delete promo coupon '}
              <strong className={`font-mono ${'text-[var(--text-primary)]'}`}>{deleteConfirmCoupon.code}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCoupon(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-coupon"
                onClick={() => {
                                  handleDeleteCoupon();
                                }}
                className="px-4 py-2 rounded-xl bg-[var(--status-error)] hover:bg-[var(--status-error)] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[var(--status-error)]/20 active:scale-95"
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
