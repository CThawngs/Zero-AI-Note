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
      isDark ? 'bg-[#171513] text-[#F7F4EE]' : 'bg-[#FBF9F5] text-[#26221D]'
    }`}>
      {/* Header & Tabs */}
      <div className={`p-4 sm:p-6 pb-0 border-b space-y-4 transition-colors duration-250 ${
        isDark ? 'border-[#38322B] bg-[#1C1916]' : 'border-[#E6E0D6] bg-[#FCFAF7]'
      }`}>
        <div>
          <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
            {t('settingsTitle')}
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
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
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                {language === 'vi' ? 'Hồ sơ Người dùng' : 'User Profile'}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40"
                  />
                  <div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>{user.name}</h4>
                    <p className={`text-xs ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        user.plan === 'PRO' 
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                          : isDark ? 'bg-[#2A2621] text-[#A8A199]' : 'bg-[#F4EFE6] text-[#6E665D]'
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
                    isDark ? 'bg-[#2A2621] hover:bg-[#38322B] border-[#38322B] text-[#F7F4EE]' : 'bg-[#F4EFE6] hover:bg-[#EAE4D9] border-[#E6E0D6] text-[#26221D]'
                  }`}
                >
                  {t('changePassword')}
                </button>
              </div>
            </div>

            {/* Plan & Subscription Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-colors ${
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                    {t('planDetails')}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
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
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95"
                    >
                      {t('upgradePro')}
                    </button>
                  ) : (
                    <button
                      id="btn-downgrade-plan"
                      onClick={downgradePlan}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                        isDark ? 'bg-[#2A2621] hover:bg-[#38322B] border-[#38322B] text-[#A8A199]' : 'bg-[#F4EFE6] hover:bg-[#EAE4D9] border-[#E6E0D6] text-[#6E665D]'
                      }`}
                    >
                      {language === 'vi' ? 'Hủy gia hạn gói' : 'Cancel subscription'}
                    </button>
                  )}
                </div>
              </div>

              {user.plan === 'PRO' && user.nextBillingDate && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>{language === 'vi' ? 'Ngày gia hạn tiếp theo: ' : 'Next renewal date: '}<strong>{user.nextBillingDate}</strong></span>
                  </div>
                  <span className="text-[11px] font-mono font-bold">199.000đ / {language === 'vi' ? 'tháng' : 'month'}</span>
                </div>
              )}

              {/* Coupon Box */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-[#38322B]' : 'border-[#EAE4D9]'}`}>
                <label className={`block text-xs font-semibold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                  {t('couponCode')}
                </label>

                {user.appliedCoupon ? (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs font-medium ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
                        {language === 'vi' ? 'Đang áp dụng mã: ' : 'Active coupon: '}<strong>{user.appliedCoupon.code}</strong> (-{user.appliedCoupon.discountPercent}%)
                      </span>
                    </div>
                    <button
                      id="btn-remove-coupon"
                      onClick={removeAppliedCoupon}
                      className="text-xs text-emerald-600 hover:text-emerald-500 underline font-medium cursor-pointer"
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
                      className={`flex-1 border rounded-xl px-3.5 py-2 text-xs uppercase font-mono focus:outline-none focus:border-amber-500 transition-colors ${
                        isDark ? 'bg-[#171513] border-[#38322B] text-[#F7F4EE] placeholder-[#78716A]' : 'bg-[#FCFAF7] border-[#E6E0D6] text-[#26221D] placeholder-[#968D82]'
                      }`}
                    />
                    <button
                      type="submit"
                      id="btn-apply-settings-coupon"
                      disabled={!couponInput.trim() || isApplyingCoupon}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 active:scale-95"
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
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                    {t('colorPaletteTitle')}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                    {t('colorPaletteDesc')}
                  </p>
                </div>
              </div>

              <ThemeSelector showModeToggle={true} />
            </div>

            {/* Payment Records Table */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                {t('paymentHistory')}
              </h3>
              <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-[#38322B]' : 'border-[#E6E0D6]'}`}>
                <table className="w-full text-xs text-left">
                  <thead className={`font-semibold uppercase text-[10px] border-b ${
                    isDark ? 'bg-[#2A2621] text-[#A8A199] border-[#38322B]' : 'bg-[#F4EFE6] text-[#6E665D] border-[#E6E0D6]'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">{language === 'vi' ? 'Mã Hóa Đơn' : 'Invoice ID'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Ngày Giao Dịch' : 'Date'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Số Tiền' : 'Amount'}</th>
                      <th className="px-4 py-3">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                      <th className="px-4 py-3 text-right">{language === 'vi' ? 'Chứng Từ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#38322B] text-[#F7F4EE]' : 'divide-[#E6E0D6] text-[#26221D]'}`}>
                    {paymentHistory.map((pay) => (
                      <tr key={pay.id} className={isDark ? 'hover:bg-[#2A2621]/40' : 'hover:bg-[#F4EFE6]/40'}>
                        <td className="px-4 py-3 font-mono text-[11px]">{pay.invoiceId}</td>
                        <td className="px-4 py-3">{pay.date}</td>
                        <td className={`px-4 py-3 font-bold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>{pay.amount}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{language === 'vi' ? 'Thành công' : 'Paid'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => addToast(language === 'vi' ? 'Tải hóa đơn PDF' : 'Download Invoice', `${pay.invoiceId}...`)}
                            className="p-1 text-[#A8A199] hover:text-amber-500 rounded cursor-pointer transition-colors"
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
              isDark ? 'bg-rose-950/15 border-rose-900/40' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  {t('dangerZone')}
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-rose-200/80' : 'text-rose-800'}`}>
                {language === 'vi' 
                  ? 'Xóa vĩnh viễn tài khoản và toàn bộ cơ sở dữ liệu ghi chú, tệp nguồn đã lưu trữ. Hành động này không thể hoàn tác.' 
                  : 'Permanently erase this account, structured notes, uploaded files, and chat history. This cannot be undone.'}
              </p>
              <button
                id="btn-open-delete-account"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
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
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                  {t('colorPaletteTitle')}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                  {t('colorPaletteDesc')}
                </p>
              </div>

              <ThemeSelector showModeToggle={true} />
            </div>

            {/* Language Preference Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
            }`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                  {t('languagePreference')}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
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
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                  {language === 'vi' ? 'Danh Sách AI Providers (BYOK)' : 'AI Providers & BYOK Keys'}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                  {language === 'vi' ? 'Cấu hình các nhà cung cấp mô hình trí tuệ nhân tạo hoặc Local LLM server' : 'Configure third-party LLMs or connect local inference engines'}
                </p>
              </div>

              <button
                id="btn-open-add-provider"
                onClick={() => setIsAddProviderModalOpen(true)}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addProvider')}</span>
              </button>
            </div>

            <div className="space-y-3">
              {aiProviders.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                  isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6]'
                }`}>
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                      {language === 'vi' ? 'Chưa có Provider AI nào' : 'No AI Providers Configured'}
                    </h4>
                    <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                      {language === 'vi' 
                        ? 'Thêm Provider AI trong Cài đặt để bắt đầu sử dụng các mô hình ngôn ngữ lớn hoặc mô hình Local.' 
                        : 'Add an AI Provider to start using cloud LLMs or self-hosted local models.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddProviderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addProvider')}</span>
                  </button>
                </div>
              ) : (
                aiProviders.map((prov) => (
                  <div
                    key={prov.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark ? 'bg-[#201D1A] border-[#38322B] hover:border-amber-500/40' : 'bg-white border-[#E6E0D6] hover:border-amber-400 shadow-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className={`text-sm font-bold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>{prov.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          prov.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold' 
                            : isDark ? 'bg-[#2A2621] text-[#78716A]' : 'bg-[#F4EFE6] text-[#968D82]'
                        }`}>
                          {prov.status === 'active' ? (language === 'vi' ? 'ĐANG KẾT NỐI' : 'ACTIVE') : (language === 'vi' ? 'TẠM TẮT' : 'DISABLED')}
                        </span>
                      </div>
                      <div className={`flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                        <span>Model: <strong className={isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}>{prov.defaultModel}</strong></span>
                        <span>•</span>
                        <span>{language === 'vi' ? 'Độ trễ:' : 'Latency:'} <strong className="text-emerald-500">{prov.latencyMs}ms</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{prov.apiKeyMasked}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => toggleProviderStatus(prov.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border active:scale-95 ${
                          prov.status === 'active'
                            ? isDark ? 'bg-[#2A2621] text-[#A8A199] border-[#38322B] hover:bg-[#38322B]' : 'bg-[#F4EFE6] text-[#6E665D] border-[#E6E0D6] hover:bg-[#EAE4D9]'
                            : 'bg-emerald-600/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-600/25'
                        }`}
                      >
                        {prov.status === 'active' 
                          ? (language === 'vi' ? 'Tắt Provider' : 'Disable') 
                          : (language === 'vi' ? 'Bật kết nối' : 'Enable')}
                      </button>

                      <button
                        onClick={() => deleteAIProvider(prov.id)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer active:scale-95 ${
                          isDark 
                            ? 'bg-[#2A2621] border-[#38322B] text-rose-400 hover:bg-rose-950/30 hover:border-rose-800' 
                            : 'bg-[#F4EFE6] border-[#E6E0D6] text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                        }`}
                        title={language === 'vi' ? 'Xóa Provider' : 'Delete Provider'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
              {t('tabNotifications')}
            </h3>

            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-colors ${
              isDark ? 'bg-[#201D1A] border-[#38322B]' : 'bg-white border-[#E6E0D6] shadow-xs'
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
                  isDark ? 'border-[#38322B]' : 'border-[#EAE4D9]'
                }`}>
                  <div className="pr-4">
                    <h4 className={`text-xs font-semibold ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>{item.title}</h4>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>{item.desc}</p>
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
                    <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 ${
                      isDark ? 'bg-[#2A2621]' : 'bg-[#E6E0D6]'
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
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                  isDark ? 'bg-[#171513] border-[#38322B] text-[#F7F4EE] placeholder-[#78716A]' : 'bg-white border-[#E6E0D6] text-[#26221D]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                {language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                  isDark ? 'bg-[#171513] border-[#38322B] text-[#F7F4EE] placeholder-[#78716A]' : 'bg-white border-[#E6E0D6] text-[#26221D]'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                  isDark ? 'bg-[#2A2621] text-[#A8A199] hover:bg-[#38322B]' : 'bg-[#F4EFE6] text-[#6E665D] hover:bg-[#EAE4D9]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-amber-600/20 active:scale-95 transition-all"
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
              isDark ? 'bg-rose-950/40 border-rose-800/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>
                {language === 'vi' 
                  ? 'Cảnh báo: Toàn bộ dữ liệu ghi chú, tệp nguồn và lịch sử thanh toán sẽ bị xoá ngay lập tức và không thể khôi phục.' 
                  : 'Warning: All notes, files, and transactions will be irreversibly erased immediately.'}
              </span>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#F7F4EE]' : 'text-[#26221D]'}`}>
                {language === 'vi' ? 'Nhập chữ ' : 'Type '}
                <strong className="text-rose-500 font-mono">DELETE</strong>
                {language === 'vi' ? ' để xác nhận:' : ' to confirm:'}
              </label>
              <input
                id="input-confirm-delete-account"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-rose-500 font-mono transition-colors ${
                  isDark ? 'bg-[#171513] border-[#38322B] text-[#F7F4EE]' : 'bg-white border-[#E6E0D6] text-[#26221D]'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                  isDark ? 'bg-[#2A2621] text-[#A8A199] hover:bg-[#38322B]' : 'bg-[#F4EFE6] text-[#6E665D] hover:bg-[#EAE4D9]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-account-final"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-md shadow-rose-600/20 active:scale-95 transition-all"
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
