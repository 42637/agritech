import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, Sprout } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications?: () => void;
  unreadAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, unreadAlertsCount = 1 }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    i18n.changeLanguage(language);
    try { localStorage.setItem('agrismart-language', language); } catch { /* storage may be unavailable */ }
    void fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: language })
    }).catch(() => undefined);
  };

  return (
    <header className="bg-white border-b border-green-100/60 sticky top-0 z-40 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#E7F7E4] flex items-center justify-center text-[#087A3D] shadow-xs">
            <Sprout className="w-6 h-6 fill-[#087A3D]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-lg text-[#102D20] tracking-tight leading-none">
                AgriSmart <span className="text-[#087A3D]">AI</span>
              </h1>
            </div>
            <p className="text-[11px] text-[#5A6E65] font-medium leading-tight mt-0.5">
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Language & Notifications */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs text-[#102D20] font-medium shadow-xs">
            <span className="mr-1 text-sm">🌐</span>
            <select
              value={i18n.resolvedLanguage || i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer pr-4 appearance-none"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 pointer-events-none" />
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
