'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GoogleAuthResponse {
  id: string;
  email: string;
  displayName: string;
  role: string;
  plan: string;
  needsPasswordSetup: boolean;
  [key: string]: unknown;
}

interface GoogleSignInButtonProps {
  onSuccess: (userData: GoogleAuthResponse) => void;
  onError?: (err: Error) => void;
  isDark?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  isDark = true,
  text = 'continue_with',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Client ID from env
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        if (onError) onError(new Error('Không nhận được Google credential. Vui lòng thử lại.'));
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Đăng nhập Google thất bại');
        onSuccess(data.user);
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const initAndRenderGsi = useCallback(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const win = window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (config: Record<string, unknown>) => void;
            renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
            prompt: () => void;
          };
        };
      };
    };

    if (win.google?.accounts?.id && containerRef.current) {
      try {
        win.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });

        containerRef.current.innerHTML = '';
        win.google.accounts.id.renderButton(containerRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: text,
          logo_alignment: 'left',
          width: containerRef.current.offsetWidth || 340,
        });

        setIsSdkReady(true);
      } catch (e) {
        console.warn('Google Identity Services render warning:', e);
      }
    }
  }, [googleClientId, handleCredentialResponse, isDark, text]);

  useEffect(() => {
    if (!googleClientId) return;

    // Retry loop until Google script loads and containerRef is ready in DOM
    const interval = setInterval(() => {
      const win = window as unknown as { google?: { accounts?: { id?: unknown } } };
      if (win.google?.accounts?.id && containerRef.current) {
        initAndRenderGsi();
        clearInterval(interval);
      }
    }, 200);

    // Initial attempt
    initAndRenderGsi();

    return () => clearInterval(interval);
  }, [googleClientId, initAndRenderGsi]);

  // Fail-closed: if no Client ID configured, show notification
  if (!googleClientId) {
    return (
      <div className={`w-full text-center text-xs py-2.5 px-3 rounded-xl border border-dashed ${
        isDark ? 'border-white/10 text-neutral-500 bg-white/2' : 'border-gray-300 text-gray-400 bg-gray-50'
      } ${className}`}>
        Google Sign-In chưa được cấu hình Client ID
      </div>
    );
  }

  const handleFallbackClick = () => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        google?: { accounts?: { id?: { prompt: () => void } } };
      };
      if (win.google?.accounts?.id) {
        try {
          win.google.accounts.id.prompt();
        } catch (e) {
          console.warn('Google One Tap prompt failed:', e);
        }
      }
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center relative ${className}`}>
      {/* Official Google GSI Render Container */}
      <div
        ref={containerRef}
        className="w-full flex justify-center overflow-hidden min-h-[40px]"
      />

      {/* Styled Overlay / Fallback Button while GSI iframe is rendering */}
      {!isSdkReady && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={isLoading}
          className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] ${
            isDark
              ? 'bg-[#1a1a1a] hover:bg-[#252525] border-white/10 text-white'
              : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
            <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z" />
          </svg>
          <span>{isLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
        </button>
      )}
    </div>
  );
};
