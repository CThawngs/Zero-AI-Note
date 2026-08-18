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
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');

  const handleGoogleLogin = () => {
    setIsLoading(true);

    const win = typeof window !== 'undefined' ? (window as unknown as {
      google?: {
        accounts?: {
          oauth2?: {
            initTokenClient: (config: {
              client_id: string;
              scope: string;
              callback: (res: { access_token?: string; error?: string }) => void;
              error_callback?: (err: unknown) => void;
            }) => { requestAccessToken: () => void };
          };
        };
      };
    }) : null;

    // Use Google Identity Services Token Client popup (Immune to redirect_uri_mismatch!)
    if (win?.google?.accounts?.oauth2 && googleClientId) {
      try {
        const tokenClient = win.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              try {
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Xác thực Google thất bại');
                
                if (onSuccess) {
                  onSuccess(data.user);
                } else {
                  window.location.href = '/app';
                }
              } catch (err) {
                setIsLoading(false);
                if (onError) onError(err instanceof Error ? err : new Error(String(err)));
              }
            } else {
              setIsLoading(false);
              if (tokenResponse.error && onError) {
                onError(new Error(tokenResponse.error));
              }
            }
          },
          error_callback: (err) => {
            setIsLoading(false);
            console.error('[Google OAuth] Token client error:', err);
            // KHÔNG fallback redirect nữa — redirect flow gây redirect_uri_mismatch.
            // Hiện lỗi rõ ràng để người dùng cấu hình đúng.
            if (onError) {
              onError(new Error('Không thể khởi tạo Google Sign-In. Kiểm tra cấu hình OAuth trong Google Cloud Console (Authorized JavaScript origins + Redirect URIs).'));
            }
          },
        });

        tokenClient.requestAccessToken();
        return;
      } catch (e) {
        setIsLoading(false);
        console.warn('[Google OAuth] TokenClient init failed:', e);
        if (onError) {
          onError(new Error('Không thể khởi tạo Google Sign-In. Kiểm tra cấu hình OAuth trong Google Cloud Console (Authorized JavaScript origins + Redirect URIs).'));
        }
      }
    } else {
      setIsLoading(false);
      if (onError) {
        onError(new Error('Google Identity Services chưa sẵn sàng. Vui lòng tải lại trang và thử lại.'));
      }
    }
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
          {isLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}
        </span>
      </button>
    </div>
  );
};
