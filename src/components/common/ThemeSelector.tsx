import React from 'react';
import { Check, Sun, Moon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { THEME_OPTIONS, ColorPalette } from '../../utils/themeTokens';

interface ThemeSelectorProps {
  showModeToggle?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ showModeToggle = true }) => {
  const { 
    colorPalette, 
    setColorPalette, 
    theme, 
    toggleTheme, 
    setTheme,
    language, 
    t 
  } = useApp();

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      {/* 5-Theme Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = colorPalette === opt.id;
          const themeName = language === 'vi' ? opt.nameVi : opt.nameEn;
          const themeDesc = language === 'vi' ? opt.descVi : opt.descEn;

          return (
            <button
              key={opt.id}
              id={`theme-card-${opt.id}`}
              type="button"
              onClick={() => setColorPalette(opt.id)}
              className={`relative flex flex-col p-2.5 sm:p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 active:scale-95 group ${
                isSelected 
                  ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/25 bg-[var(--accent-subtle)] shadow-md' 
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/40 hover:shadow-xs'
              }`}
            >
              {/* Active Checkmark Pill in Corner */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-text)] flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Split Dark / Light Preview Box */}
              <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden border border-black/10 flex relative shadow-inner mb-2.5">
                {/* Dark Half (Left) */}
                <div 
                  className="w-1/2 h-full flex flex-col justify-between p-1.5 transition-colors relative"
                  style={{ backgroundColor: opt.darkBg }}
                >
                  <div className="flex items-center gap-1">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                      style={{ backgroundColor: opt.darkAccent }}
                    />
                    <span className="text-[8px] font-bold tracking-tight text-[#FAF9F5]/70 uppercase">
                      {language === 'vi' ? 'Tối' : 'Dark'}
                    </span>
                  </div>
                  {/* Subtle mini card preview in dark half */}
                  <div 
                    className="w-full h-3.5 rounded-md border border-white/5 opacity-80"
                    style={{ backgroundColor: opt.darkSurface }}
                  />
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-full bg-black/20 z-10" />

                {/* Light Half (Right) */}
                <div 
                  className="w-1/2 h-full flex flex-col justify-between p-1.5 transition-colors relative"
                  style={{ backgroundColor: opt.lightBg }}
                >
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[8px] font-bold tracking-tight text-[#26221D]/70 uppercase">
                      {language === 'vi' ? 'Sáng' : 'Light'}
                    </span>
                    <span 
                      className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                      style={{ backgroundColor: opt.lightAccent }}
                    />
                  </div>
                  {/* Subtle mini card preview in light half */}
                  <div 
                    className="w-full h-3.5 rounded-md border border-black/5 opacity-90"
                    style={{ backgroundColor: opt.lightSurface }}
                  />
                </div>
              </div>

              {/* Theme Name & Indicator */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold tracking-tight truncate ${
                  isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                }`}>
                  {themeName}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 px-1.5 py-0.2 rounded-md">
                    {language === 'vi' ? 'Dùng' : 'ON'}
                  </span>
                )}
              </div>

              {/* Theme Description */}
              <p className="text-[10px] line-clamp-2 mt-1 leading-snug text-[var(--text-muted)]">
                {themeDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dark / Light Toggle Switch inside Theme Section */}
      {showModeToggle && (
        <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                {t('themeModeLabel')}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {t('themeModeDesc')}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] self-stretch sm:self-auto justify-center">
            <button
              id="theme-mode-dark-btn"
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                isDark 
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Chế độ Tối' : 'Dark Mode'}</span>
            </button>

            <button
              id="theme-mode-light-btn"
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                !isDark 
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Chế độ Sáng' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
