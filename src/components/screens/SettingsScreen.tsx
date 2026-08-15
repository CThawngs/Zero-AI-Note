import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Cpu, 
  Bell, 
  Palette,
  CreditCard, 
  Crown, 
  ShieldAlert, 
  Key, 
  Check, 
  X, 
  Loader2, 
  Download, 
  Plus, 
  Trash2, 
  AlertTriangle,
  FileText,
  Activity,
  Zap,
  Sparkles,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AddProviderModal } from '../modals/AddProviderModal';
import { ThemeSelector } from '../common/ThemeSelector';

export const SettingsScreen: React.FC = () => {
  const { 
    user, 
    setUser, 
    setCurrentScreen, 
    downgradePlan, 
    applyCouponCode, 
    removeAppliedCoupon, 
    paymentHistory, 
    aiProviders, 
    toggleProviderStatus,
    deleteAIProvider,
    settingsActiveTab,
    setSettingsActiveTab,
    addToast,
    theme,
    language,
    t
  } = useApp();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Account 2-step Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Add Provider Modal
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  // Notification toggles
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    noteReady: true,
    billingAlerts: true,
    weeklyReport: false
  });

  const isDark = theme === 'dark';

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || isApplyingCoupon) return;

    setIsApplyingCoupon(true);
    const res = await applyCouponCode(couponInput);
    setIsApplyingCoupon(false);

    if (res.success) {
      addToast(language === 'vi' ? 'Áp dụng mã thành công' : 'Coupon Applied', res.message, 'success');
      setCouponInput('');
    } else {
      addToast(language === 'vi' ? 'Không thể áp dụng mã' : 'Failed to apply coupon', res.message, 'error');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast(
        language === 'vi' ? 'Mật khẩu không khớp' : 'Passwords do not match', 
        language === 'vi' ? 'Vui lòng kiểm tra lại mật khẩu xác nhận.' : 'Please verify confirmation password.', 
        'warning'
      );
      return;
    }
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    addToast(
      language === 'vi' ? 'Đổi mật khẩu thành công' : 'Password changed', 
      language === 'vi' ? 'Mật khẩu mới của bạn đã có hiệu lực.' : 'Your new password is now active.'
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      addToast(
        language === 'vi' ? 'Xác nhận không hợp lệ' : 'Invalid confirmation', 
        language === 'vi' ? 'Vui lòng nhập chính xác chữ "DELETE".' : 'Please type exactly "DELETE".', 
        'warning'
      );
      return;
    }
    setIsDeleteModalOpen(false);
    addToast(
      language === 'vi' ? 'Đã xóa tài khoản' : 'Account deleted', 
      language === 'vi' ? 'Toàn bộ dữ liệu của bạn đã được xóa.' : 'All data was erased.'
    );
    setCurrentScreen('login');
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors duration-250 ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Header & Tabs */}
      <div className={`p-4 sm:p-6 pb-0 border-b space-y-4 transition-colors duration-250 ${
        isDark ? 'border-[var(--border-color)] bg-[var(--bg-sidebar)]' : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
      }`}>
        <div>
          <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
            {t('settingsTitle')}
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
            {language === 'vi' 
              ? 'Quản trị tài khoản, gói cước, khóa AI Provider và cấu hình thông báo' 
              : 'Manage profile, subscription plan, AI Providers (BYOK), and system alerts'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-transparent overflow-x-auto custom-scrollbar pb-0.5">
          {[
            { id: 'account', label: t('tabAccount'), icon: User },
            { id: 'appearance', label: language === 'vi' ? 'Giao diện & Theme' : 'Theme & Appearance', icon: Palette },
            { id: 'ai-providers', label: t('tabAIProviders'), icon: Cpu },
            { id: 'notifications', label: t('tabNotifications'), icon: Bell }
          ].map((item) => {
            const Icon = item.icon;
            const active = settingsActiveTab === item.id;
            return (
              <button
                key={item.id}
                id={`settings-tab-${item.id}`}
                onClick={() => setSettingsActiveTab(item.id as any)}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  active
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar max-w-4xl">
        {settingsActiveTab === 'account' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* User Profile Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {language === 'vi' ? 'Hồ sơ Người dùng' : 'User Profile'}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--accent-primary)]/40"
                  />
                  <div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{user.name}</h4>
                    <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        user.plan === 'PRO' 
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' 
                          : isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                      }`}>
                        {user.plan === 'PRO' ? '★ ' + t('proPlan') : t('freePlan')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-open-change-password"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer self-start sm:self-auto active:scale-95 ${
                    isDark ? 'bg-[var(--bg-hover)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {t('changePassword')}
                </button>
              </div>
            </div>

            {/* Plan & Subscription Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {t('planDetails')}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                    {user.plan === 'PRO' 
                      ? (language === 'vi' ? 'Bạn đang sử dụng toàn bộ tính năng cao cấp không giới hạn.' : 'You have active access to unlimited AI power, TTS, and multi-sources.')
                      : (language === 'vi' ? 'Nâng cấp để mở khóa tính năng AI TTS, Multi-source và không giới hạn lưu trữ.' : 'Upgrade to unlock AI Audio TTS, multi-source extraction, and unlimited storage.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.plan === 'FREE' ? (
                    <button
                      id="btn-upgrade-from-settings"
                      onClick={() => setCurrentScreen('pricing')}
                      className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)] hover:from-[var(--accent-primary)] hover:to-[var(--accent-primary)] text-white text-xs font-bold rounded-xl shadow-md shadow-[var(--accent-primary)]/20 transition-all cursor-pointer active:scale-95"
                    >
                      {t('upgradePro')}
                    </button>
                  ) : (
                    <button
                      id="btn-downgrade-plan"
                      onClick={downgradePlan}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                        isDark ? 'bg-[var(--bg-hover)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {language === 'vi' ? 'Hủy gia hạn gói' : 'Cancel subscription'}
                    </button>
                  )}
                </div>
              </div>

              {user.plan === 'PRO' && user.nextBillingDate && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-[var(--accent-subtle)]/20 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]' : 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>{language === 'vi' ? 'Ngày gia hạn tiếp theo: ' : 'Next renewal date: '}<strong>{user.nextBillingDate}</strong></span>
                  </div>
                  <span className="text-xs font-mono font-bold">199.000đ / {language === 'vi' ? 'tháng' : 'month'}</span>
                </div>
              )}

              {/* Coupon Box */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]'}`}>
                <label className={`block text-xs font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {t('couponCode')}
                </label>

                {user.appliedCoupon ? (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'bg-[var(--accent-subtle)]/30 border-[var(--status-success)]/40' : 'bg-[var(--accent-subtle)] border-[var(--status-success)]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[var(--status-success)]" />
                      <span className={`text-xs font-medium ${isDark ? 'text-[var(--status-success)]' : 'text-[var(--status-success)]'}`}>
                        {language === 'vi' ? 'Đang áp dụng mã: ' : 'Active coupon: '}<strong>{user.appliedCoupon.code}</strong> (-{user.appliedCoupon.discountPercent}%)
                      </span>
                    </div>
                    <button
                      id="btn-remove-coupon"
                      onClick={removeAppliedCoupon}
                      className="text-xs text-[var(--status-success)] hover:text-[var(--status-success)] underline font-medium cursor-pointer"
                    >
                      {language === 'vi' ? 'Gỡ mã' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      id="input-settings-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={language === 'vi' ? 'Nhập mã coupon (Ví dụ: PRO50, SUMMER)...' : 'Enter coupon code (e.g. PRO50)...'}
                      className={`flex-1 border rounded-xl px-3.5 py-2 text-xs uppercase font-mono focus:outline-none focus:border-[var(--accent-primary)] transition-colors ${
                        isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]'
                      }`}
                    />
                    <button
                      type="submit"
                      id="btn-apply-settings-coupon"
                      disabled={!couponInput.trim() || isApplyingCoupon}
                      className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      {isApplyingCoupon && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{t('apply')}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Theme Preference Card in Account */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {t('colorPaletteTitle')}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                    {t('colorPaletteDesc')}
                  </p>
                </div>
              </div>

              <ThemeSelector showModeToggle={true} />
            </div>

            {/* Payment Records Table */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {t('paymentHistory')}
              </h3>
              <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-color)]'}`}>
                <table className="w-full text-xs text-left">
                  <thead className={`font-semibold uppercase text-xs border-b ${
                    isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">{language === 'vi' ? 'Mã Hóa Đơn' : 'Invoice ID'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Ngày Giao Dịch' : 'Date'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Số Tiền' : 'Amount'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                      <th className="px-4 py-3 text-right">{language === 'vi' ? 'Chứng Từ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[var(--border-color)] text-[var(--text-primary)]' : 'divide-[var(--border-color)] text-[var(--text-primary)]'}`}>
                    {paymentHistory.map((pay) => (
                      <tr key={pay.id} className={isDark ? 'hover:bg-[var(--bg-hover)]/40' : 'hover:bg-[var(--bg-hover)]/40'}>
                        <td className="px-4 py-3 font-mono text-xs">{pay.invoiceId}</td>
                        <td className="px-4 py-3">{pay.date}</td>
                        <td className={`px-4 py-3 font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{pay.amount}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--status-success)] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                            <span>{language === 'vi' ? 'Thành công' : 'Paid'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => addToast(language === 'vi' ? 'Tải hóa đơn PDF' : 'Download Invoice', `${pay.invoiceId}...`)}
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded cursor-pointer transition-colors"
                            title="PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danger Zone */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[var(--status-error)]/15 border-[var(--status-error)]/40' : 'bg-[var(--status-error)] border-[var(--status-error)]'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[var(--status-error)]" />
                <h3 className="text-xs font-bold text-[var(--status-error)] uppercase tracking-wider">
                  {t('dangerZone')}
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-[var(--status-error)]/80' : 'text-[var(--status-error)]'}`}>
                {language === 'vi' 
                  ? 'Xóa vĩnh viễn tài khoản và toàn bộ cơ sở dữ liệu ghi chú, tệp nguồn đã lưu trữ. Hành động này không thể hoàn tác.' 
                  : 'Permanently erase this account, structured notes, uploaded files, and chat history. This cannot be undone.'}
              </p>
              <button
                id="btn-open-delete-account"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-[var(--status-error)] hover:bg-[var(--status-error)] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {t('deleteAccount')}
              </button>
            </div>
          </motion.div>
        )}

        {settingsActiveTab === 'appearance' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Theme Selector Section */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {t('colorPaletteTitle')}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {t('colorPaletteDesc')}
                </p>
              </div>

              <ThemeSelector showModeToggle={true} />
            </div>

            {/* Language Preference Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {t('languagePreference')}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Lựa chọn ngôn ngữ hiển thị cho toàn bộ giao diện' : 'Select your preferred interface display language'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => addToast(language === 'vi' ? 'Ngôn ngữ đã chọn' : 'Language Selected', 'Tiếng Việt')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-95 ${
                    language === 'vi'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] font-bold text-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇻🇳</span>
                    <span className="text-xs">Tiếng Việt (Mặc định)</span>
                  </div>
                  {language === 'vi' && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>

                <button
                  type="button"
                  onClick={() => addToast(language === 'vi' ? 'Ngôn ngữ đã chọn' : 'Language Selected', 'English')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-95 ${
                    language === 'en'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] font-bold text-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇬🇧</span>
                    <span className="text-xs">English (US)</span>
                  </div>
                  {language === 'en' && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {settingsActiveTab === 'ai-providers' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {language === 'vi' ? 'Danh Sách AI Providers (BYOK)' : 'AI Providers & BYOK Keys'}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                  {language === 'vi' ? 'Cấu hình các nhà cung cấp mô hình trí tuệ nhân tạo hoặc Local LLM server' : 'Configure third-party LLMs or connect local inference engines'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addToast(
                    language === 'vi' ? 'Cảnh báo Model hết free' : 'Model Free Tier Ended',
                    language === 'vi' ? 'Model gpt-4o không còn free trên OpenAI, đã tự động chuyển sang gpt-4o-mini' : 'Model gpt-4o no longer free on OpenAI, switched to gpt-4o-mini',
                    'warning'
                  )}
                  className="px-3 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Demo: Model hết free
                </button>
                <button
                  id="btn-open-add-provider"
                  onClick={() => setIsAddProviderModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-white rounded-xl text-xs font-semibold shadow-md shadow-[var(--accent-primary)]/20 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('addProvider')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {aiProviders.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                  isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                }`}>
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {language === 'vi' ? 'Chưa có Provider AI nào' : 'No AI Providers Configured'}
                    </h4>
                    <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                      {language === 'vi' 
                        ? 'Thêm Provider AI trong Cài đặt để bắt đầu sử dụng các mô hình ngôn ngữ lớn hoặc mô hình Local.' 
                        : 'Add an AI Provider to start using cloud LLMs or self-hosted local models.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddProviderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addProvider')}</span>
                  </button>
                </div>
              ) : (
                aiProviders.map((prov) => (
                  <div
                    key={prov.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
                      isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40' : 'bg-white border-[var(--border-color)] hover:border-[var(--accent-primary)] shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className={`text-sm font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{prov.name}</h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            prov.status === 'active' 
                              ? 'bg-[var(--status-success)]/20 text-[var(--status-success)] border border-[var(--status-success)]/30 font-bold' 
                              : isDark ? 'bg-[var(--bg-hover)] text-[var(--text-muted)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                          }`}>
                            {prov.status === 'active' ? (language === 'vi' ? 'ĐANG KẾT NỐI' : 'ACTIVE') : (language === 'vi' ? 'TẠM TẮT' : 'DISABLED')}
                          </span>
                        </div>
                        <div className={`flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                          <span>Model: <strong className={isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{prov.defaultModel}</strong></span>
                          <span>•</span>
                          <span>{language === 'vi' ? 'Độ trễ:' : 'Latency:'} <strong className="text-[var(--status-success)]">{prov.latencyMs}ms</strong></span>
                          <span>•</span>
                          <span className="font-mono text-xs">{prov.apiKeyMasked}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* New Toggles */}
                        <div className="flex items-center gap-3 mr-2">
                           <div className="flex items-center gap-1.5 relative group">
                             <input 
                               type="checkbox" 
                               id={`import-free-${prov.id}`}
                               checked={prov.importFreeModels || false} 
                               disabled={prov.isCustomEndpoint}
                               onChange={() => updateAIProvider(prov.id, { importFreeModels: !prov.importFreeModels })}
                               className="accent-[var(--accent-primary)] cursor-pointer disabled:opacity-50"
                             />
                             <label 
                               htmlFor={`import-free-${prov.id}`}
                               className={`text-xs cursor-pointer select-none ${prov.isCustomEndpoint ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed' : 'text-[var(--text-primary)]'}`}
                             >
                               {language === 'vi' ? 'Import free' : 'Import free'}
                             </label>
                             {prov.isCustomEndpoint && (
                               <span className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-help text-[11px] font-bold border border-[var(--border-color)] w-3.5 h-3.5 rounded-full flex items-center justify-center relative">
                                 i
                                 <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 hidden group-hover:block bg-black text-white text-[10px] p-2 rounded-lg shadow-lg z-50 leading-relaxed font-normal">
                                   {language === 'vi' 
                                     ? 'Không áp dụng cho endpoint tự host — không có khái niệm giá free/trả phí' 
                                     : 'Not applicable for self-hosted endpoints'}
                                 </span>
                               </span>
                             )}
                           </div>

                           <div className="flex items-center gap-1.5 relative group">
                             <input 
                               type="checkbox" 
                               id={`sync-${prov.id}`}
                               checked={prov.syncEnabled || false}
                               disabled={prov.isCustomEndpoint}
                               onChange={() => updateAIProvider(prov.id, { syncEnabled: !prov.syncEnabled, importFreeModels: true })}
                               className="accent-[var(--accent-primary)] cursor-pointer disabled:opacity-50"
                             />
                             <label 
                               htmlFor={`sync-${prov.id}`}
                               className={`text-xs cursor-pointer select-none ${prov.isCustomEndpoint ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed' : 'text-[var(--text-primary)]'}`}
                             >
                               {language === 'vi' ? 'Sync' : 'Sync'}
                             </label>
                             {prov.syncEnabled && (
                               <div className="flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-ping shrink-0" />
                                 <span className="text-[10px] text-[var(--status-success)] font-bold shrink-0">{language === 'vi' ? 'Đang đồng bộ' : 'Syncing'}</span>
                               </div>
                             )}
                           </div>
                        </div>

                        <button
                          onClick={() => toggleProviderStatus(prov.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border active:scale-95 ${
                            prov.status === 'active'
                              ? isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                              : 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30 hover:bg-[var(--status-success)]/25'
                          }`}
                        >
                          {prov.status === 'active' 
                            ? (language === 'vi' ? 'Tắt' : 'Disable') 
                            : (language === 'vi' ? 'Bật' : 'Enable')}
                        </button>
                      </div>
                    </div>

                    {prov.importFreeModels && (prov.freeModelsList?.length || 0) > 0 && (
                       <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs space-y-2">
                          <button 
                            onClick={() => setExpandedProviders(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                            className="text-[var(--accent-primary)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{prov.freeModelsCount} {language === 'vi' ? 'model đang free' : 'models are free'}</span>
                            <span>{expandedProviders[prov.id] ? '▲' : '▼'}</span>
                          </button>

                          {expandedProviders[prov.id] && (
                            <div className="pl-2 space-y-1 py-1 border-l-2 border-[var(--accent-primary)]/40">
                              {prov.freeModelsList?.map(m => (
                                <div key={m} className="font-mono text-xs text-[var(--text-secondary)] flex items-center justify-between">
                                  <span>• {m}</span>
                                  <span className="text-[10px] bg-[var(--status-success)]/10 text-[var(--status-success)] px-1.5 py-0.5 rounded font-sans font-medium">FREE</span>
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {settingsActiveTab === 'notifications' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
              {t('tabNotifications')}
            </h3>

            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-colors ${
              isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-xs'
            }`}>
              {[
                {
                  id: 'noteReady',
                  title: language === 'vi' ? 'Thông báo khi hoàn tất xử lý Note' : 'Note Synthesis Notifications',
                  desc: language === 'vi' ? 'Nhận thông báo khi file âm thanh hoặc tài liệu dài hoàn thành trích xuất' : 'Receive instant alerts when AI completes multi-modal transcription'
                },
                {
                  id: 'emailDigest',
                  title: language === 'vi' ? 'Email tổng hợp định kỳ hàng ngày' : 'Daily Digest Email',
                  desc: language === 'vi' ? 'Nhận bản tóm tắt các ghi chú quan trọng và nhắc nhở ôn tập Spaced Repetition' : 'Receive recap digests and Spaced Repetition flashcard reminders'
                },
                {
                  id: 'billingAlerts',
                  title: language === 'vi' ? 'Cảnh báo thanh toán & biên lai hóa đơn' : 'Billing & Invoice Receipts',
                  desc: language === 'vi' ? 'Thông báo trước ngày gia hạn gói cước Pro hoặc khi có phát sinh phí' : 'Alerts before Pro plan renewal or receipt generation'
                },
                {
                  id: 'weeklyReport',
                  title: language === 'vi' ? 'Báo cáo thống kê hiệu suất học tập hàng tuần' : 'Weekly Knowledge Analytics',
                  desc: language === 'vi' ? 'Số lượng từ vựng, tài liệu và thời gian ghi chú đã tích lũy' : 'Aggregated study hours, tokens parsed, and keyword masteries'
                }
              ].map((item) => (
                <div key={item.id} className={`flex items-center justify-between pb-4 border-b last:border-0 last:pb-0 ${
                  isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]'
                }`}>
                  <div className="pr-4">
                    <h4 className={`text-xs font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{item.title}</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(notifications as any)[item.id]}
                      onChange={(e) => {
                        setNotifications(prev => ({ ...prev, [item.id]: e.target.checked }));
                        addToast(t('savedSettings'), t('toastSavedSettings'));
                      }}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)] ${
                      isDark ? 'bg-[var(--bg-hover)]' : 'bg-[var(--border-color)]'
                    }`} />
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPasswordModalOpen(false)}
          title={t('changePassword')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors ${
                  isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors ${
                  isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[var(--accent-primary)]/20 active:scale-95 transition-all"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2-Step Delete Account Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDeleteModalOpen(false)}
          title={language === 'vi' ? 'Xác nhận xóa tài khoản vĩnh viễn' : 'Delete Account Confirmation'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              isDark ? 'bg-[var(--status-error)]/40 border-[var(--status-error)]/50 text-[var(--status-error)]' : 'bg-[var(--status-error)] border-[var(--status-error)] text-[var(--status-error)]'
            }`}>
              <AlertTriangle className="w-5 h-5 text-[var(--status-error)] shrink-0 mt-0.5" />
              <span>
                {language === 'vi' 
                  ? 'Cảnh báo: Toàn bộ dữ liệu ghi chú, tệp nguồn và lịch sử thanh toán sẽ bị xoá ngay lập tức và không thể khôi phục.' 
                  : 'Warning: All notes, files, and transactions will be irreversibly erased immediately.'}
              </span>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {language === 'vi' ? 'Nhập chữ ' : 'Type '}
                <strong className="text-[var(--status-error)] font-mono">DELETE</strong>
                {language === 'vi' ? ' để xác nhận:' : ' to confirm:'}
              </label>
              <input
                id="input-confirm-delete-account"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--status-error)] font-mono transition-colors ${
                  isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-account-final"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-[var(--status-error)] hover:bg-[var(--status-error)] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-md shadow-[var(--status-error)]/20 active:scale-95 transition-all"
              >
                {language === 'vi' ? 'Xác nhận xoá vĩnh viễn' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Provider Modal */}
      <AddProviderModal
        isOpen={isAddProviderModalOpen}
        onClose={() => setIsAddProviderModalOpen(false)}
      />
    </div>
  );
};
