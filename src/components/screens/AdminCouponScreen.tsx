import React, { useState, useEffect } from 'react';
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
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
  FileText,
  Activity,
  Server,
  Zap,
  Loader2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CouponItem } from '../../types';
import { Modal } from '../common/Modal';

type AdminTab = 'dashboard' | 'coupons' | 'revenue' | 'users' | 'config';

export const AdminCouponScreen: React.FC = () => {
  const { 
    coupons,
    setCoupons,
    setCurrentScreen,
    addToast,
    user,
    theme,
    language,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Hard block non-admin users at mount level
  useEffect(() => {
    if (!user || user.email !== 'nguyenchithang2804@gmail.com') {
      setCurrentScreen('chat');
    }
  }, [user, setCurrentScreen]);

  if (!user || user.email !== 'nguyenchithang2804@gmail.com') {
    return null;
  }

  // Stats State
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Coupons State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'discount-high' | 'code-az'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<CouponItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states for Create/Edit Coupon
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
  const [formValue, setFormValue] = useState<number>(20);
  const [formAppliedTo, setFormAppliedTo] = useState<'all' | 'paid' | 'pro'>('all');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('100');
  const [formExpiryDate, setFormExpiryDate] = useState('31/12/2026');
  const [formStatus, setFormStatus] = useState<'active' | 'expired' | 'disabled'>('active');

  // Subscriptions & Revenue State
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);

  // System Configuration State
  const [sysConfig, setSysConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const isDark = theme === 'dark';

  // Load Admin Data on tab switch
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'revenue') {
      fetchSubscriptions();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'config') {
      fetchConfig();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        if (data.coupons) {
          setCoupons(data.coupons);
        }
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setIsLoadingSubs(true);
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionsList(data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setSysConfig(data.config);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // --- COUPONS CRUD ACTIONS ---
  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('ZERONOTE_' + Math.random().toString(36).substring(2, 7).toUpperCase());
    setFormType('percent');
    setFormValue(20);
    setFormAppliedTo('all');
    setFormUsageLimit('100');
    setFormExpiryDate('2026-12-31');
    setFormStatus('active');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType('percent');
    setFormValue(Math.min(100, Math.max(1, Number(coupon.discount_value) || 20)));
    setFormAppliedTo(coupon.applies_to ?? 'all');
    setFormUsageLimit(coupon.usage_limit !== null && coupon.usage_limit !== undefined ? String(coupon.usage_limit) : '');
    
    // Format date string to YYYY-MM-DD for <input type="date" />
    let expStr = '';
    if (coupon.expires_at) {
      try {
        const d = new Date(coupon.expires_at);
        if (!isNaN(d.getTime())) {
          expStr = d.toISOString().split('T')[0];
        }
      } catch {
        expStr = '';
      }
    }
    setFormExpiryDate(expStr);
    setFormStatus(coupon.status);
    setIsCreateModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    let limitVal: number | null = null;
    if (formUsageLimit && formUsageLimit.trim()) {
      const parsed = parseInt(formUsageLimit.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        limitVal = Math.min(2147483647, parsed);
      }
    }

    let safeExpiry: string | null = null;
    if (formExpiryDate && formExpiryDate.trim()) {
      const raw = formExpiryDate.trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split('/');
        safeExpiry = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T23:59:59Z`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        safeExpiry = `${raw}T23:59:59Z`;
      } else {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          safeExpiry = d.toISOString();
        }
      }
    }

    try {
      const response = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCoupon?.id,
          code: formCode.trim().toUpperCase(),
          discount_type: 'percent',
          discount_value: Math.min(100, Math.max(1, Number(formValue) || 10)),
          applies_to: formAppliedTo,
          usage_limit: limitVal,
          expires_at: safeExpiry,
          status: formStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save coupon');
      }

      await fetchCoupons();
      setIsCreateModalOpen(false);
      addToast(
        language === 'vi' ? 'Lưu coupon thành công' : 'Coupon Saved',
        language === 'vi' ? `Mã "${formCode.toUpperCase()}" giảm ${Math.min(100, Math.max(1, Number(formValue)))}% đã sẵn sàng áp dụng.` : `Coupon "${formCode.toUpperCase()}" (${formValue}%) is ready.`,
        'success'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi lưu Coupon' : 'Save Failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const handleToggleCouponStatus = async (coupon: CouponItem) => {
    const nextStatus = coupon.status === 'active' ? 'disabled' : 'active';
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          applies_to: coupon.applies_to,
          usage_limit: coupon.usage_limit,
          expires_at: coupon.expires_at,
          status: nextStatus
        }),
      });

      if (!response.ok) throw new Error('Update status failed');

      await fetchCoupons();
      addToast(
        language === 'vi' ? 'Cập nhật trạng thái' : 'Status Updated',
        `${coupon.code}: ${nextStatus.toUpperCase()}`,
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi cập nhật' : 'Update Failed',
        'Could not toggle status',
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

      await fetchCoupons();
      setDeleteConfirmCoupon(null);
      addToast(
        language === 'vi' ? 'Đã xoá Coupon' : 'Coupon Deleted',
        language === 'vi' ? 'Mã giảm giá đã được gỡ khỏi hệ thống.' : 'Coupon removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xoá Coupon' : 'Delete Failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    addToast(t('copied'), code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- USERS MANAGEMENT ACTIONS ---
  const handleUpdateUser = async (userId: string, role?: string, plan?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, plan }),
      });

      if (!res.ok) throw new Error('Failed to update user');

      await fetchUsers();
      setEditingUser(null);
      addToast(
        language === 'vi' ? 'Cập nhật người dùng' : 'User Updated',
        language === 'vi' ? 'Quyền và gói cước đã được cập nhật thành công.' : 'Permissions and plan updated.',
        'success'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi cập nhật' : 'Update Failed',
        err instanceof Error ? err.message : 'Error updating user',
        'error'
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa tài khoản này?' : 'Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');

      await fetchUsers();
      addToast(
        language === 'vi' ? 'Đã xóa người dùng' : 'User Deleted',
        language === 'vi' ? 'Tài khoản người dùng đã được xóa.' : 'User account removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xóa tài khoản' : 'Delete Failed',
        err instanceof Error ? err.message : 'Error deleting user',
        'error'
      );
    }
  };

  // --- SUBSCRIPTION ACTIONS ---
  const handleUpdateSubscriptionStatus = async (subscriptionId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, status }),
      });

      if (!res.ok) throw new Error('Failed to update subscription');

      await fetchSubscriptions();
      addToast(
        language === 'vi' ? 'Cập nhật đăng ký' : 'Subscription Updated',
        `Trạng thái: ${status.toUpperCase()}`,
        'success'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi cập nhật' : 'Update Failed',
        err instanceof Error ? err.message : 'Error updating subscription',
        'error'
      );
    }
  };

  // Filter and Sort Coupons
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
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Filter Subscriptions
  const filteredSubs = subscriptionsList.filter(s => {
    if (subStatusFilter !== 'all' && s.status !== subStatusFilter) return false;
    if (subSearchQuery.trim()) {
      const q = subSearchQuery.toLowerCase().trim();
      return (
        (s.user_email || '').toLowerCase().includes(q) ||
        (s.bill_id || '').toLowerCase().includes(q) ||
        (s.coupon_code || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter Users
  const filteredUsers = usersList.filter(u => {
    if (userPlanFilter !== 'all' && u.plan !== userPlanFilter) return false;
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase().trim();
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.display_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'active' || status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>{status === 'paid' ? (language === 'vi' ? 'Đã thanh toán' : 'Paid') : (language === 'vi' ? 'Đang hoạt động' : 'Active')}</span>
        </span>
      );
    }
    if (status === 'expired' || status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          <span>{status === 'pending' ? (language === 'vi' ? 'Chờ thanh toán' : 'Pending') : (language === 'vi' ? 'Hết hạn' : 'Expired')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-500/15 text-zinc-500 border border-zinc-500/30">
        <XCircle className="w-3 h-3" />
        <span>{status === 'canceled' ? (language === 'vi' ? 'Đã hủy' : 'Canceled') : (language === 'vi' ? 'Đã tắt' : 'Disabled')}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Admin Navigation Header */}
      <div className="h-14 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-[var(--text-primary)]">
              {language === 'vi' ? 'Cổng Quản Trị Hệ Thống (Admin Portal)' : 'Admin Management Portal'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Zero AI Note Production Control Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-return-to-app"
            onClick={() => setCurrentScreen('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '← Quay lại Ứng dụng' : '← Back to App'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Left Sidebar */}
        <aside className="w-60 border-r p-4 flex-col justify-between hidden md:flex shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {language === 'vi' ? 'Menu Quản Trị' : 'Admin Navigation'}
            </div>
            {[
              { id: 'dashboard', label: language === 'vi' ? 'Bảng điều khiển' : 'Dashboard', icon: LayoutDashboard },
              { id: 'coupons', label: language === 'vi' ? 'Mã Coupon & Promos' : 'Coupons & Promos', icon: Ticket },
              { id: 'revenue', label: language === 'vi' ? 'Doanh thu & Giao dịch' : 'Revenue & Orders', icon: BarChart3 },
              { id: 'users', label: language === 'vi' ? 'Quản lý Người dùng' : 'User Accounts', icon: Users },
              { id: 'config', label: language === 'vi' ? 'Cấu hình & Hạ tầng' : 'Configuration', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 text-left ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-md shadow-[var(--accent-primary)]/25'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl border text-xs bg-[var(--bg-app)] border-[var(--border-color)] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-bold text-[var(--text-primary)]">{language === 'vi' ? 'SuperAdmin Online' : 'SuperAdmin Active'}</p>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email || 'admin@zeronote.ai'}</p>
          </div>
        </aside>

        {/* Admin Main Body */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)]">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {language === 'vi' ? 'Tổng Quan Hệ Thống' : 'System Overview Dashboard'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {language === 'vi' ? 'Số liệu tăng trưởng người dùng, doanh thu và lưu trữ thời gian thực' : 'Real-time user growth, revenue volume and storage metrics'}
                  </p>
                </div>
                <button
                  onClick={fetchStats}
                  disabled={isLoadingStats}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span>{language === 'vi' ? 'Làm mới số liệu' : 'Refresh Metrics'}</span>
                </button>
              </div>

              {/* Metric KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Users */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{language === 'vi' ? 'Tổng Người Dùng' : 'Total Users'}</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Users className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {statsData?.users?.total_users ?? 0}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">{statsData?.users?.pro_users ?? 0} Pro</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">{statsData?.users?.ultra_users ?? 0} Ultra</span>
                  </div>
                </div>

                {/* Gross Revenue */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{language === 'vi' ? 'Doanh Thu Đã Thu' : 'Gross Revenue'}</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><DollarSign className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {Number(statsData?.revenue?.total_revenue ?? 0).toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {statsData?.revenue?.paid_subscriptions ?? 0} {language === 'vi' ? 'giao dịch hoàn tất' : 'paid orders'}
                  </div>
                </div>

                {/* Total Notes Created */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{language === 'vi' ? 'Ghi Chú Đã Tạo' : 'Total Notes Generated'}</span>
                    <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><FileText className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {statsData?.notes?.total_notes ?? 0}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    +{statsData?.notes?.notes_today ?? 0} {language === 'vi' ? 'trong 24h qua' : 'today'}
                  </div>
                </div>

                {/* Coupons Redeemed */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{language === 'vi' ? 'Mã Khuyến Mại' : 'Coupons Active'}</span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Ticket className="w-4 h-4" /></div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {statsData?.coupons?.active_coupons ?? 0}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {statsData?.coupons?.total_redemptions ?? 0} {language === 'vi' ? 'lượt đã áp dụng' : 'redemptions'}
                  </div>
                </div>
              </div>

              {/* Recent Orders & Users Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Subscriptions */}
                <div className="p-6 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {language === 'vi' ? 'Giao Dịch Gần Đây (ZeroInvoice)' : 'Recent Transactions'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('revenue')}
                      className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Xem tất cả →' : 'View all →'}
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--border-color)] text-xs">
                    {(statsData?.recentSubscriptions || []).length === 0 ? (
                      <p className="py-6 text-center text-[var(--text-muted)]">{language === 'vi' ? 'Chưa có giao dịch nào.' : 'No transactions recorded.'}</p>
                    ) : (
                      statsData?.recentSubscriptions?.map((sub: any) => (
                        <div key={sub.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{sub.user_email || 'Khách vãng lai'}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">{sub.bill_id} • Gói {sub.plan?.toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{Number(sub.amount || 0).toLocaleString('vi-VN')}đ</p>
                            <span className="text-[10px] text-[var(--text-muted)]">{getStatusBadge(sub.status)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="p-6 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {language === 'vi' ? 'Người Dùng Đăng Ký Mới' : 'Recent Registered Users'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Quản lý user →' : 'Manage users →'}
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--border-color)] text-xs">
                    {(statsData?.recentUsers || []).length === 0 ? (
                      <p className="py-6 text-center text-[var(--text-muted)]">{language === 'vi' ? 'Chưa có người dùng nào.' : 'No users found.'}</p>
                    ) : (
                      statsData?.recentUsers?.map((u: any) => (
                        <div key={u.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{u.display_name || u.email}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{u.email}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              u.plan === 'ultra' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                              u.plan === 'pro' ? 'bg-blue-500/15 text-blue-500 border-blue-500/30' :
                              'bg-zinc-500/15 text-zinc-500 border-zinc-500/30'
                            }`}>
                              {u.plan?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COUPONS & PROMOS */}
          {activeTab === 'coupons' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Controls */}
              <div className="p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {language === 'vi' ? 'Quản Lý Mã Khuyến Mại & Coupon' : 'Coupon Campaign Management'}
                    </h2>
                    <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                      {language === 'vi' 
                        ? 'Tạo mới, theo dõi số lượt sử dụng và điều chỉnh thời hạn mã khuyến mại' 
                        : 'Create promotional vouchers, track redemption counts, and adjust expiry rules'}
                    </p>
                  </div>

                  <button
                    id="btn-open-create-coupon"
                    onClick={openCreateModal}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] rounded-xl text-xs font-bold shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'vi' ? '+ Tạo Coupon Mới' : '+ Create New Coupon'}</span>
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      id="input-search-coupons"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'vi' ? 'Tìm kiếm mã coupon, đối tượng áp dụng...' : 'Search coupons, plan targets...'}
                      className="w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
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

              {/* Coupons Table */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                <div className="rounded-2xl border overflow-x-auto custom-scrollbar border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead className="border-b font-semibold uppercase text-xs tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-5 py-3.5">{language === 'vi' ? 'Mã Coupon' : 'Code'}</th>
                        <th className="px-4 py-3.5">{language === 'vi' ? 'Loại & Mức Giảm' : 'Type & Value'}</th>
                        <th className="px-4 py-3.5">{language === 'vi' ? 'Gói Áp Dụng' : 'Target Plan'}</th>
                        <th className="px-4 py-3.5">{language === 'vi' ? 'Đã Dùng / Giới Hạn' : 'Usage / Limit'}</th>
                        <th className="px-4 py-3.5">{language === 'vi' ? 'Hết Hạn' : 'Expiry'}</th>
                        <th className="px-4 py-3.5">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                        <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                      {filteredCoupons.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)]">
                            {language === 'vi' ? 'Không tìm thấy mã coupon nào.' : 'No coupons found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCoupons.map((coupon) => (
                          <tr key={coupon.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                            {/* Code */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                                <span className="font-mono font-bold text-sm tracking-wide text-[var(--text-primary)]">
                                  {coupon.code}
                                </span>
                                <button
                                  onClick={() => handleCopyCoupon(coupon.code)}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                  title="Copy code"
                                >
                                  {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>

                            {/* Value */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {coupon.discount_type === 'percent'
                                  ? `${language === 'vi' ? 'Giảm' : 'Off'} ${coupon.discount_value}%`
                                  : `${language === 'vi' ? 'Giảm' : 'Off'} ${Number(coupon.discount_value ?? 0).toLocaleString('vi-VN')}đ`}
                              </span>
                            </td>

                            {/* Applied to */}
                            <td className="px-4 py-3.5 capitalize font-medium whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md border text-[11px] font-bold bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
                                {(coupon.applies_to ?? 'all').toUpperCase()}
                              </span>
                            </td>

                            {/* Usage Count */}
                            <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                              <span className="font-bold text-[var(--text-primary)]">{coupon.usage_count ?? 0}</span>
                              <span className="text-[var(--text-muted)]">
                                {' '} / {coupon.usage_limit !== null ? coupon.usage_limit : '∞'}
                              </span>
                            </td>

                            {/* Expiry */}
                            <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                              {coupon.expires_at || (language === 'vi' ? 'Không thời hạn' : 'Unlimited')}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {getStatusBadge(coupon.status)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleCouponStatus(coupon)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                    coupon.status === 'active' 
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {coupon.status === 'active' ? (language === 'vi' ? 'Tắt' : 'Disable') : (language === 'vi' ? 'Bật' : 'Enable')}
                                </button>
                                <button
                                  onClick={() => openEditModal(coupon)}
                                  className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmCoupon(coupon)}
                                  className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  title="Xóa"
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
          )}

          {/* TAB 3: REVENUE & TRANSACTIONS */}
          {activeTab === 'revenue' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {language === 'vi' ? 'Lịch Sử Giao Dịch & Đăng Ký Gói' : 'Subscription & Order Tracking'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {language === 'vi' ? 'Dữ liệu giao dịch đồng bộ trực tiếp từ cổng ZeroInvoice' : 'Direct synced billing logs from ZeroInvoice gateway'}
                  </p>
                </div>
                <button
                  onClick={fetchSubscriptions}
                  disabled={isLoadingSubs}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubs ? 'animate-spin' : ''}`} />
                  <span>{language === 'vi' ? 'Đồng bộ lại' : 'Sync Orders'}</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    placeholder={language === 'vi' ? 'Tìm theo email, mã bill, coupon...' : 'Search by email, bill ID...'}
                    className="w-full rounded-xl pl-10 pr-4 py-2 text-xs border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="flex gap-1.5">
                  {['all', 'paid', 'pending', 'canceled'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border capitalize cursor-pointer ${
                        subStatusFilter === s
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 font-bold'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="rounded-2xl border overflow-x-auto custom-scrollbar border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="border-b font-semibold uppercase text-xs tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-5 py-3.5">Bill ID</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Khách Hàng' : 'Customer'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Gói' : 'Plan'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Số Tiền' : 'Amount'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Mã Giảm' : 'Coupon'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Thời Gian' : 'Date'}</th>
                      <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                    {filteredSubs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-[var(--text-muted)]">
                          {language === 'vi' ? 'Không có giao dịch nào.' : 'No transactions recorded.'}
                        </td>
                      </tr>
                    ) : (
                      filteredSubs.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-xs text-[var(--text-primary)]">
                            {sub.bill_id}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-[var(--text-primary)]">{sub.user_name || 'Anonymous'}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{sub.user_email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${
                              sub.plan === 'ultra' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                            }`}>
                              {sub.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(sub.amount || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px]">
                            {sub.coupon_code || '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            {getStatusBadge(sub.status)}
                          </td>
                          <td className="px-4 py-3.5 text-[10px] text-[var(--text-muted)]">
                            {sub.created_at ? new Date(sub.created_at).toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {sub.status !== 'paid' && (
                              <button
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, 'paid')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 cursor-pointer"
                              >
                                {language === 'vi' ? 'Duyệt Đã Trả' : 'Mark Paid'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {language === 'vi' ? 'Quản Lý Danh Sách Người Dùng' : 'User Accounts Directory'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {language === 'vi' ? 'Phân quyền SuperAdmin, nâng/hạ gói cước và kiểm tra ghi chú của từng tài khoản' : 'Role permissions, plan assignment and account oversight'}
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>{language === 'vi' ? 'Làm mới' : 'Refresh Users'}</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={language === 'vi' ? 'Tìm theo tên, email...' : 'Search users by name or email...'}
                    className="w-full rounded-xl pl-10 pr-4 py-2 text-xs border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {['all', 'free', 'pro', 'ultra'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setUserPlanFilter(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border uppercase cursor-pointer ${
                        userPlanFilter === p
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 font-bold'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border overflow-x-auto custom-scrollbar border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="border-b font-semibold uppercase text-xs tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-5 py-3.5">{language === 'vi' ? 'Tài Khoản' : 'Account'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Vai Trò (Role)' : 'Role'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Gói Cước (Plan)' : 'Plan'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Số Note' : 'Notes'}</th>
                      <th className="px-4 py-3.5">{language === 'vi' ? 'Ngày Tham Gia' : 'Joined'}</th>
                      <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Phân Quyền / Gói' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-[var(--text-muted)]">
                          {language === 'vi' ? 'Không tìm thấy người dùng.' : 'No users match criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold">
                                {(u.display_name || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--text-primary)]">{u.display_name || 'Chưa đặt tên'}</p>
                                <p className="text-[11px] text-[var(--text-muted)]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              u.role === 'admin' ? 'bg-red-500/15 text-red-500 border-red-500/30' : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30'
                            }`}>
                              {u.role === 'admin' ? '🛡️ SuperAdmin' : '👤 User'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              u.plan === 'ultra' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                              u.plan === 'pro' ? 'bg-blue-500/15 text-blue-500 border-blue-500/30' :
                              'bg-zinc-500/15 text-zinc-500 border-zinc-500/30'
                            }`}>
                              {u.plan?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">
                            {u.note_count ?? 0}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-[var(--text-muted)]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Plan Switcher */}
                              <select
                                value={u.plan}
                                onChange={(e) => handleUpdateUser(u.id, undefined, e.target.value)}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="ultra">Ultra</option>
                              </select>

                              {/* Toggle Role */}
                              <button
                                onClick={() => handleUpdateUser(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                className="px-2 py-1 rounded-lg border border-[var(--border-color)] text-[10px] font-bold hover:border-[var(--accent-primary)] cursor-pointer"
                                title="Đổi quyền Admin"
                              >
                                {u.role === 'admin' ? 'Hạ User' : 'Set Admin'}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                                title="Xóa tài khoản"
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
          )}

          {/* TAB 5: CONFIGURATION & HEALTH */}
          {activeTab === 'config' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {language === 'vi' ? 'Tình Trạng Hạ Tầng & Cấu Hình' : 'System Health & Configuration'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {language === 'vi' ? 'Giám sát kết nối cơ sở dữ liệu Neon, ZeroInvoice VietQR và Gemini AI Engine' : 'Neon DB, ZeroInvoice and AI model pool status'}
                  </p>
                </div>
                <button
                  onClick={fetchConfig}
                  disabled={isLoadingConfig}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig ? 'animate-spin' : ''}`} />
                  <span>{language === 'vi' ? 'Kiểm tra kết nối' : 'Ping Infrastructure'}</span>
                </button>
              </div>

              {/* Infrastructure Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Database */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Neon Postgres</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                      {sysConfig?.database?.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Serverless Postgres with pooled connections. Latency: <span className="font-bold text-[var(--text-primary)]">{sysConfig?.database?.latencyMs ?? 12}ms</span>
                  </p>
                </div>

                {/* ZeroInvoice */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">ZeroInvoice API</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                      {sysConfig?.zeroInvoice?.status || 'Connected'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    VietQR Gateway. Key: <span className="font-mono text-[10px]">{sysConfig?.zeroInvoice?.apiKeyMasked || 'zi_1776...82de'}</span>
                  </p>
                </div>

                {/* Gemini Engine */}
                <div className="p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Gemini 2.0 Flash</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                      {sysConfig?.gemini?.status || 'Ready'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Default model for structured synthesis and multi-modal parsing.
                  </p>
                </div>
              </div>

              {/* Plan Quotas Reference Matrix */}
              <div className="p-6 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Hạn Mức & Phân Cấp Gói PRD Đang Áp Dụng' : 'Enforced PRD Plan Quotas'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl border bg-[var(--bg-app)] border-[var(--border-color)] space-y-1.5">
                    <p className="font-bold text-emerald-500 uppercase">Free Plan</p>
                    <p>• Max 20 Notes Storage</p>
                    <p>• 3 Templates (Cornell/Outline/Summary)</p>
                    <p>• Max 5 Custom Templates</p>
                    <p>• 3 Export Formats (PDF/DOCX/MD)</p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-[var(--bg-app)] border-blue-500/30 space-y-1.5">
                    <p className="font-bold text-blue-500 uppercase">Pro Plan (99k)</p>
                    <p>• Max 50 Notes Storage</p>
                    <p>• 9 Templates (+ Meeting/Lecture/Q&A...)</p>
                    <p>• Max 25 Custom Templates</p>
                    <p>• Static HTML Preview & Export</p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-[var(--bg-app)] border-amber-500/30 space-y-1.5">
                    <p className="font-bold text-amber-500 uppercase">Ultra Plan (199k)</p>
                    <p>• Unlimited (∞) Notes Storage</p>
                    <p>• All 17 Templates System</p>
                    <p>• Unlimited (∞) Custom Templates</p>
                    <p>• Interactive HTML & ZIP Multi-Export</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingCoupon ? (language === 'vi' ? 'Chỉnh Sửa Coupon' : 'Edit Coupon') : (language === 'vi' ? 'Tạo Coupon Khuyến Mại Mới' : 'Create New Coupon')}
          subtitle={language === 'vi' ? 'Thiết lập mã giảm giá, mức giảm, thời hạn và số lần sử dụng' : 'Configure code, discount value, limit and expiry'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                {language === 'vi' ? 'Mã Coupon' : 'Coupon Code'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="VD: ZERONOTE50"
                className="w-full uppercase font-mono tracking-wider font-bold rounded-xl px-3.5 py-2.5 text-xs border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  {language === 'vi' ? 'Mức Giảm Giá (%)' : 'Discount Percentage (%)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={formValue}
                    onChange={(e) => setFormValue(Math.min(100, Math.max(1, Number(e.target.value))))}
                    placeholder="20"
                    className="w-full rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[var(--accent-primary)] pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  {language === 'vi' ? 'Gói Áp Dụng' : 'Target Plan'}
                </label>
                <select
                  value={formAppliedTo}
                  onChange={(e) => setFormAppliedTo(e.target.value as any)}
                  className="w-full rounded-xl px-3 py-2.5 text-xs border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] outline-none"
                >
                  <option value="all">{language === 'vi' ? 'Tất cả các gói' : 'All Plans'}</option>
                  <option value="paid">{language === 'vi' ? 'Gói trả phí (Pro & Ultra)' : 'Paid Plans (Pro & Ultra)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  {language === 'vi' ? 'Giới Hạn Lượt Dùng' : 'Usage Limit'}
                </label>
                <input
                  type="text"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder={language === 'vi' ? 'Để trống = Không giới hạn' : 'Blank = Unlimited'}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  {language === 'vi' ? 'Ngày Hết Hạn' : 'Expiry Date'}
                </label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                {language === 'vi' ? 'Trạng Thái' : 'Status'}
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] outline-none"
              >
                <option value="active">{language === 'vi' ? 'Đang hoạt động (Active)' : 'Active'}</option>
                <option value="disabled">{language === 'vi' ? 'Tạm tắt (Disabled)' : 'Disabled'}</option>
                <option value="expired">{language === 'vi' ? 'Hết hạn (Expired)' : 'Expired'}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmCoupon && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmCoupon(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Coupon' : 'Confirm Coupon Deletion'}
          subtitle={language === 'vi' ? `Bạn có chắc muốn xóa vĩnh viễn coupon "${deleteConfirmCoupon.code}"?` : `Permanently delete coupon "${deleteConfirmCoupon.code}"?`}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--text-secondary)]">
              {language === 'vi' ? 'Hành động này không thể hoàn tác. Khách hàng sẽ không thể nhập mã này trong tương lai.' : 'This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmCoupon(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteCoupon}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-red-700 active:scale-95"
              >
                {language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
