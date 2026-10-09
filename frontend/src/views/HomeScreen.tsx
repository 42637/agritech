import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MapPin, Map, Sprout, ChevronRight } from 'lucide-react';
import type { Farm } from '../services/api';
import {
  RefWeatherIcon,
  RefSoilIcon,
  RefAlertIcon,
  RefIrrigationIcon,
  RefCropIcon,
  RefInsightsIcon,
  RefArrowBtn
} from '../components/RefIcons';

interface HomeScreenProps {
  onNavigate: (route: string) => void;
  selectedFarm?: Farm | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, selectedFarm }) => {
  const { t } = useTranslation();

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Hero Greeting Section with Photorealistic Indian Farmer Background */}
      <div className="relative rounded-3xl overflow-hidden shadow-md h-48 border border-green-100">
        <img
          src="/assets/farmer_hero.jpg"
          alt="Farmer in green field"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAF5] via-[#FAFAF5]/85 to-transparent w-3/4 pointer-events-none" />

        <div className="relative z-10 p-5 flex flex-col justify-center h-full max-w-[65%]">
          <h2 className="text-2xl font-black text-[#102D20] tracking-tight leading-none drop-shadow-2xs">
            {t('greeting', 'Hello Farmer!')}
          </h2>
          <p className="text-xs font-semibold text-[#5A6E65] mt-1.5 leading-snug">
            {t('howCanWeHelp', 'How can we help you today?')}
          </p>
        </div>
      </div>

      {/* Ask AgriSmart Main Card */}
      <button
        onClick={() => onNavigate('ask-agri')}
        className="w-full bg-[#E7F7E4] hover:bg-[#DBF3D7] transition-all duration-200 border border-[#BDEBB4] rounded-3xl p-4 shadow-sm flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#087A3D] group-hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#087A3D] flex items-center justify-center text-white shadow-inner">
                <Mic className="w-6 h-6 animate-pulse-slow" />
              </div>
            </div>
            <span className="absolute -inset-1 rounded-full bg-[#087A3D]/20 animate-ping pointer-events-none" />
          </div>

          <div>
            <h3 className="font-extrabold text-lg text-[#102D20] leading-tight">
              {t('askAgriSmart', 'Ask AgriSmart')}
            </h3>
            <p className="text-xs font-medium text-[#5A6E65] mt-0.5">
              {t('askAgriSub', 'Tap and speak about your farm')}
            </p>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-white/90 border border-green-200 flex items-center justify-center text-[#087A3D] group-hover:bg-[#087A3D] group-hover:text-white transition-colors shadow-2xs">
          <ChevronRight className="w-6 h-6" />
        </div>
      </button>

      {/* Six Feature Grid Cards matching Reference Image 2 exact icons */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* 1. Weather Updates */}
        <button
          onClick={() => onNavigate('weather')}
          className="bg-white hover:border-sky-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefWeatherIcon />
            <RefArrowBtn colorBg="bg-sky-100" colorIcon="text-sky-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('weatherUpdates', 'Weather Updates')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('weatherSub', 'Today & 7-day forecast')}
            </p>
          </div>
        </button>

        {/* 2. Soil Intelligence */}
        <button
          onClick={() => onNavigate('soil')}
          className="bg-white hover:border-amber-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefSoilIcon />
            <RefArrowBtn colorBg="bg-amber-100/70" colorIcon="text-amber-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('soilIntelligence', 'Soil Intelligence')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('soilSub', 'Know your soil better')}
            </p>
          </div>
        </button>

        {/* 3. Climate Risk Alerts */}
        <button
          onClick={() => onNavigate('climate-alerts')}
          className="bg-white hover:border-rose-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefAlertIcon />
            <RefArrowBtn colorBg="bg-rose-100" colorIcon="text-rose-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('climateRiskAlerts', 'Climate Risk Alerts')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('climateSub', 'Stay prepared for risks')}
            </p>
          </div>
        </button>

        {/* 4. Smart Irrigation */}
        <button
          onClick={() => onNavigate('irrigation')}
          className="bg-white hover:border-emerald-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefIrrigationIcon />
            <RefArrowBtn colorBg="bg-[#E0F7FA]" colorIcon="text-teal-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('smartIrrigation', 'Smart Irrigation')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('irrigationSub', 'Irrigate smartly, save water')}
            </p>
          </div>
        </button>

        {/* 5. Crop Recommendation */}
        <button
          onClick={() => onNavigate('crop-recommendations')}
          className="bg-white hover:border-purple-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefCropIcon />
            <RefArrowBtn colorBg="bg-purple-100" colorIcon="text-purple-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('cropRecommendation', 'Crop Recommendation')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('cropSub', 'Find best crops for farm')}
            </p>
          </div>
        </button>

        {/* 6. Farm Insights */}
        <button
          onClick={() => onNavigate('farm-insights')}
          className="bg-white hover:border-amber-300 border border-gray-100 rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <RefInsightsIcon />
            <RefArrowBtn colorBg="bg-amber-100" colorIcon="text-amber-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#102D20] leading-tight">
              {t('farmInsights', 'Farm Insights')}
            </h4>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
              {t('insightsSub', 'Grow smarter with data')}
            </p>
          </div>
        </button>
      </div>

      {/* My Farm Bottom Banner */}
      <div className="bg-[#E7F7E4]/90 border border-green-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#087A3D] text-white flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#102D20] text-sm leading-tight">
              {t('myFarm', 'My Farm')}
            </h4>
            <div className="flex items-center gap-1 text-xs text-[#5A6E65] font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#087A3D]" />
              <span>{selectedFarm ? `${selectedFarm.village}, ${selectedFarm.district}` : 'Andhra Pradesh'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('my-farm')}
          className="bg-white hover:bg-green-50 border border-green-300 text-[#087A3D] font-bold text-xs px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          <span>{t('viewOnMap', 'View on Map')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
