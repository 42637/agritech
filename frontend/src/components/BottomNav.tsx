import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, MapPin, Sprout, User, CloudRain, Droplet } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', label: t('navHome', 'Home'), icon: Home },
    { id: 'my-farm', label: t('navMyFarm', 'My Farm'), icon: MapPin },
    { id: 'soil', label: t('navSoil', 'Soil'), icon: Sprout },
    { id: 'climate-alerts', label: t('navClimate', 'Climate'), icon: CloudRain },
    { id: 'irrigation', label: t('navIrrigation', 'Irrigation'), icon: Droplet },
    { id: 'profile', label: t('navProfile', 'Profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-green-100 px-1.5 py-1.5 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'climate-alerts' && activeTab === 'climate-map');
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#E7F7E4] text-[#087A3D] font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
