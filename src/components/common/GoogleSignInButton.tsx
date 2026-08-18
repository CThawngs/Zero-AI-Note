'use client';

import React, { useState } from 'react';

export interface GoogleAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  plan: string;
  needsPasswordSetup?: boolean;
  [key: string]: unknown;
}

interface GoogleSignInButtonProps {
  onSuccess?: (userData: GoogleAuthUser) => void;
  onError?: (err: Error) => void;
  isDark?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  isDark = true,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Standard OAuth 2.0 redirect flow — completely immune to popup blockers,
    // Cross-Origin-Opener-Policy issues, and adblocker iframe filters.
    window.location.href = '/api/auth/google/login';
  };

  if (!googleClientId) {
    return (
      <div
        className={`w-full text-center text-xs py-2.5 px-3 rounded-xl border border-dashed ${
          isDark
            ? 'border-white/10 text-neutral-500 bg-white/2'
            : 'border-gray-300 text-gray-400 bg-gray-50'
        } ${className}`}
      >
        Google Sign-In chưa được cấu hình Client ID
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center relative ${className}`}>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] shadow-xs ${
          isDark
            ? 'bg-[#181818] hover:bg-[#222222] border-white/12 text-white hover:border-white/20'
            : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800 hover:border-gray-400'
        }`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
          />
        </svg>
        <span>
          {isLoading ? 'Đang chuyển hướng Google...' : 'Tiếp tục với Google'}
        </span>
      </button>
    </div>
  );
};
