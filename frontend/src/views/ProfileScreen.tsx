import React from 'react';
import { User, LogOut } from 'lucide-react';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-[#087A3D]">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20]">Farmer Profile</h2>
          <p className="text-xs text-[#5A6E65]">Manage profile & settings</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#E7F7E4] text-[#087A3D] font-extrabold text-xl flex items-center justify-center">
            RK
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#102D20]">Ramesh Kumar</h3>
            <p className="text-xs text-gray-500 font-semibold">+91 98765 43210 (Verified)</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs font-semibold">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <span className="text-gray-600">Preferred Language</span>
            <span className="font-extrabold text-[#087A3D]">English / తెలుగు</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <span className="text-gray-600">Primary Region</span>
            <span className="font-extrabold text-[#102D20]">West Godavari, AP</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <span className="text-gray-600">Google Gemini AI Status</span>
            <span className="font-extrabold text-emerald-600">Active (Gemini 2.5 Flash)</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-rose-200 text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
