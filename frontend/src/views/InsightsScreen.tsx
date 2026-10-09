import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sprout,
  Sun,
  CloudRain,
  Droplet,
  Calendar,
  Check,
  Lightbulb,
  BarChart3,
  MapPin,
  FileText,
  Users,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api, type Farm } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface InsightsScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  farms = [],
  selectedFarm,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Irrigation' | 'Growth' | 'History'>('Overview');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5, state: 'Andhra Pradesh' },
    { id: 2, village: 'Tanuku', acreage: 1.8, state: 'Andhra Pradesh' },
    { id: 3, village: 'Narsapuram', acreage: 3.2, state: 'Andhra Pradesh' },
    { id: 4, village: 'Eluru', acreage: 1.0, state: 'Andhra Pradesh' }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  const fetchDynamicInsights = async () => {
    setLoadingAi(true);
    try {
      const res = await api.getFarmInsights(activeFarm.id || 1);
      if (res && res.insights) {
        setAiInsights(res.insights);
      }
    } catch (e) {
      console.warn("Using fallback dynamic AI context", e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchDynamicInsights();
  }, [activeFarm.id]);

  const previousYields = [
    { year: '2020', yield: 3.8, height: 'h-24' },
    { year: '2021', yield: 4.2, height: 'h-28' },
    { year: '2022', yield: 4.6, height: 'h-32' },
    { year: '2023', yield: 4.8, height: 'h-36' }
  ];

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
      {/* Header matching Reference Image */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center p-1 shadow-2xs">
            <svg viewBox="0 0 48 48" className="w-8 h-8">
              <path d="M8 38 Q24 24 40 38 Q32 44 24 44 Q16 44 8 38 Z" fill="#6E4729" />
              <path d="M24 35 C24 26 23 20 22 14" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M23 22 C13 18 9 9 17 7 C23 7 24 16 23 22 Z" fill="#22C55E" />
              <path d="M23 18 C33 14 37 5 29 3 C23 3 22 12 23 18 Z" fill="#15803D" />
            </svg>
          </div>

          <div>
            <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Farm Insights</h2>
            <p className="text-xs text-[#5A6E65] font-semibold">{activeFarm.village} Farm • {activeFarm.acreage || 2.5} acres</p>
          </div>
        </div>
      </div>

      {/* Crop Header Banner Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-3.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CropIconMapper cropId="Paddy" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-[#102D20]">Paddy</h3>
              <span className="bg-[#E7F7E4] text-[#087A3D] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-green-200">
                Vegetative Stage
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#087A3D] fill-current" />
              <span>{activeFarm.village}, Andhra Pradesh</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Navigation Sub-Tabs */}
      <div className="flex gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        {(['Overview', 'Irrigation', 'Growth', 'History'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-[#07552F] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SUB-TAB 1: OVERVIEW */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {/* Hero Paddy Field Image Card */}
          <div className="w-full h-44 relative rounded-3xl overflow-hidden shadow-xs border border-green-100">
            <img
              src="/assets/crop_paddy.jpg"
              alt="Lush Paddy Field"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-2xl flex items-center gap-1.5 font-extrabold text-xs text-[#087A3D] shadow-xs">
              <Sprout className="w-4 h-4 fill-[#087A3D]" />
              <span>Healthy</span>
            </div>
            <div className="absolute bottom-3 right-3 text-[10px] font-semibold text-white bg-black/40 px-2.5 py-0.5 rounded-xl backdrop-blur-xs">
              Last updated: 10 Aug, 10:00 AM
            </div>
          </div>

          {/* 3 Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-2xs space-y-1">
              <p className="text-2xl font-black text-[#102D20]">6.8</p>
              <p className="text-[10px] text-gray-500 font-semibold">Soil pH</p>
              <span className="bg-[#E7F7E4] text-[#087A3D] text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block">
                🌱 Optimal
              </span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-2xs space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Droplet className="w-4 h-4 text-sky-500 fill-sky-400" />
                <span className="text-2xl font-black text-[#102D20]">28%</span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold">Soil Moisture</p>
              <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block">
                💧 Good
              </span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-2xs space-y-1">
              <p className="text-lg font-black text-[#102D20]">Good</p>
              <p className="text-[10px] text-gray-500 font-semibold">Plant Health</p>
              <Sprout className="w-4 h-4 text-[#087A3D] mx-auto mt-1" />
            </div>
          </div>

          {/* Current Weather Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-3.5 shadow-xs space-y-2">
            <h4 className="font-extrabold text-sm text-[#102D20]">Current Weather</h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-gray-50 rounded-2xl p-2">
                <Sun className="w-5 h-5 text-amber-400 fill-amber-300 mx-auto" />
                <p className="font-black text-sm text-[#102D20] mt-1">32°C</p>
                <p className="text-[10px] text-gray-500 font-medium">Clear</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-2">
                <CloudRain className="w-5 h-5 text-sky-500 mx-auto" />
                <p className="font-black text-sm text-[#102D20] mt-1">0 mm</p>
                <p className="text-[10px] text-gray-500 font-medium">Rainfall (Last 7d)</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-2">
                <Droplet className="w-5 h-5 text-emerald-500 mx-auto" />
                <p className="font-black text-sm text-[#102D20] mt-1">58%</p>
                <p className="text-[10px] text-gray-500 font-medium">Humidity</p>
              </div>
            </div>
          </div>

          {/* Irrigation Recommendation Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500 fill-sky-400" />
                <h4 className="font-extrabold text-sm text-[#102D20]">Irrigation Recommendation</h4>
              </div>
              <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200">
                Today v
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-xl font-black text-sky-700">25 – 30 mm</p>
                <p className="text-[10px] text-gray-500 font-semibold">Water Amount</p>
                <p className="text-[10px] text-gray-500 font-medium">≈ 1.8 – 1.9 lakh liters / 2.5 acres</p>
              </div>

              <div className="space-y-1 border-l border-gray-100 pl-3">
                <p className="text-xl font-black text-[#087A3D]">Every 5 days</p>
                <p className="text-[10px] text-gray-500 font-semibold">Frequency</p>
                <p className="text-[10px] text-gray-500 font-medium">Next: 16 Aug</p>
              </div>
            </div>
          </div>

          {/* Quick Insights Card */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#102D20]">
                <Lightbulb className="w-5 h-5 text-amber-600 fill-amber-400" />
                <h4 className="font-extrabold text-sm">Quick Insights (Gemini AI)</h4>
              </div>
              <button 
                onClick={fetchDynamicInsights} 
                disabled={loadingAi}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-2 py-1 rounded-full transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
                <span>{loadingAi ? 'Refreshing...' : 'Refresh AI'}</span>
              </button>
            </div>

            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              {(aiInsights?.quick_insights || [
                `Optimal soil pH (${(activeFarm as any).soil_ph || 6.8}) supports healthy crop growth.`,
                "Maintain soil moisture in recommended range.",
                `Good overall crop growth for current stage in ${activeFarm.village}.`,
                "Monitor for seasonal pests in next 2 weeks."
              ]).map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5] shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SUB-TAB 2: IRRIGATION */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Irrigation' && (
        <div className="space-y-4">
          {/* Irrigation Schedule Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[#102D20]">Irrigation Schedule</h4>
              <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200 cursor-pointer">
                Today v
              </span>
            </div>

            <div className="bg-sky-50/60 rounded-2xl p-3 text-center space-y-1 border border-sky-100">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Recommended Water Amount</p>
              <p className="text-2xl font-black text-sky-700">25 – 30 mm</p>
              <p className="text-[10px] text-gray-500 font-medium">(= 1.8 – 1.9 lakh liters for 2.5 acres)</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Irrigation Frequency</p>
                  <p className="font-bold text-xs text-[#102D20]">Every 5 days</p>
                  <p className="text-[9px] text-gray-400 font-medium">Next: 16 Aug 2024</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Irrigation Method</p>
                  <p className="font-bold text-xs text-[#102D20]">Canal Water</p>
                  <p className="text-[9px] text-gray-400 font-medium">Surface Irrigation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Based Adjustment Card */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h4 className="font-extrabold text-sm text-[#102D20]">Weather Based Adjustment</h4>
            </div>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              No rainfall expected in next 5 days. Follow the recommended irrigation schedule.
            </p>
          </div>

          {/* Water Source Status Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Droplet className="w-5 h-5 fill-sky-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Water Source Status</p>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-base text-[#102D20]">Canal Water</h4>
                  <span className="bg-[#E7F7E4] text-[#087A3D] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-green-200">
                    Available
                  </span>
                </div>
              </div>
            </div>
            <button className="text-xs font-extrabold text-[#087A3D] hover:underline flex items-center gap-0.5">
              <span>Change</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Irrigation Tips Card */}
          <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-[#07552F]">
              <Sprout className="w-5 h-5" />
              <h4 className="font-extrabold text-sm">Irrigation Tips</h4>
            </div>

            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Irrigate early morning or evening.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Maintain water level of 3–5 cm in field.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Avoid over-irrigation to prevent nutrient loss.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Check canal water availability regularly.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SUB-TAB 3: GROWTH */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Growth' && (
        <div className="space-y-4">
          {/* Growth Stage Stepper Timeline */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <h4 className="font-extrabold text-base text-[#102D20]">Growth Stage</h4>

            {/* 5 Stage Stepper Grid */}
            <div className="grid grid-cols-5 gap-1.5 text-center pt-1 items-start">
              {/* Stage 1: Sowing */}
              <div className="space-y-1 p-1">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-gray-600">Sowing</p>
                <p className="text-[8px] text-gray-400 font-medium">(0–20 days)</p>
              </div>

              {/* Stage 2: Vegetative (ACTIVE HIGHLIGHT) */}
              <div className="space-y-1 p-1 bg-[#E7F7E4] border-2 border-[#087A3D] rounded-2xl shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#087A3D] text-white mx-auto flex items-center justify-center">
                  <Sprout className="w-4 h-4 fill-current" />
                </div>
                <p className="text-[10px] font-black text-[#087A3D]">Vegetative</p>
                <p className="text-[8px] text-[#087A3D] font-bold">(21–40 days)</p>
              </div>

              {/* Stage 3: Tillering */}
              <div className="space-y-1 p-1">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-gray-600">Tillering</p>
                <p className="text-[8px] text-gray-400 font-medium">(41–70 days)</p>
              </div>

              {/* Stage 4: Panicle */}
              <div className="space-y-1 p-1">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-gray-600">Panicle</p>
                <p className="text-[8px] text-gray-400 font-medium">(71–100 days)</p>
              </div>

              {/* Stage 5: Harvest */}
              <div className="space-y-1 p-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-gray-600">Harvest</p>
                <p className="text-[8px] text-gray-400 font-medium">(101+ days)</p>
              </div>
            </div>
          </div>

          {/* Current Stage Details Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[#102D20]">Current Stage Details</h4>
              <span className="bg-[#E7F7E4] text-[#087A3D] text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                Vegetative Stage (Day 35) • On Track
              </span>
            </div>

            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Good plant growth observed.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Leaf color is healthy.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Soil moisture is adequate.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Continue recommended irrigation.</span>
              </li>
            </ul>
          </div>

          {/* Stage Photos (Crop Image & Field Image) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs space-y-1 p-2">
              <div className="w-full h-24 rounded-xl overflow-hidden">
                <img src="/assets/crop_paddy.jpg" alt="Crop Close-up" className="w-full h-full object-cover" />
              </div>
              <p className="font-extrabold text-xs text-[#102D20] px-1">Crop Image</p>
              <p className="text-[9px] text-gray-400 font-medium px-1">10 Aug 2024</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs space-y-1 p-2">
              <div className="w-full h-24 rounded-xl overflow-hidden">
                <img src="/assets/crop_paddy.jpg" alt="Paddy Field" className="w-full h-full object-cover object-bottom" />
              </div>
              <p className="font-extrabold text-xs text-[#102D20] px-1">Field Image</p>
              <p className="text-[9px] text-gray-400 font-medium px-1">10 Aug 2024</p>
            </div>
          </div>

          {/* Expected Timeline Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2">
            <h4 className="font-extrabold text-sm text-[#102D20]">Expected Timeline</h4>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Days in Current Stage</p>
                  <p className="font-black text-sm text-[#102D20]">35 days</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Expected Next Stage</p>
                  <p className="font-black text-sm text-[#102D20]">In 15 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Tips Card */}
          <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-[#07552F]">
              <Sprout className="w-5 h-5" />
              <h4 className="font-extrabold text-sm">Growth Tips</h4>
            </div>

            <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Maintain recommended water level.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Ensure adequate nitrogen application.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Monitor for common pests (stem borer, leaf folder).</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[2.5]" />
                <span>Keep field weed-free.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SUB-TAB 4: HISTORY */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'History' && (
        <div className="space-y-4">
          {/* Past Data (This Farm) Grid */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[#102D20]">Past Data (This Farm)</h4>
              <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200 cursor-pointer">
                Season v
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Last Year Yield</p>
                  <p className="font-black text-sm text-[#102D20]">4.8 t/acre</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E7F7E4] flex items-center justify-center text-[#087A3D] shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Crop Performance</p>
                  <p className="font-extrabold text-xs text-[#087A3D]">Good</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Sowing Date</p>
                  <p className="font-bold text-xs text-[#102D20]">12 Jun 2023</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Harvest Date</p>
                  <p className="font-bold text-xs text-[#102D20]">10 Oct 2023</p>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Seasons Yield Chart */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#102D20]">
              <Sprout className="w-5 h-5 text-[#087A3D]" />
              <h4 className="font-extrabold text-sm">Previous Seasons Yield</h4>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-end justify-between gap-4 h-36 border-b border-gray-200 px-4 pb-1">
                {previousYields.map((item) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-black text-[#102D20]">{item.yield}</span>
                    <div className={`w-full max-w-[36px] ${item.height} bg-[#07552F] rounded-t-xl transition-all group-hover:bg-[#087A3D]`} />
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{item.year}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-semibold text-center mt-2">Yield (tons/acre)</p>
            </div>
          </div>

          {/* Notes & Observations Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#087A3D]" />
              <h4 className="font-extrabold text-sm text-[#102D20]">Notes & Observations</h4>
            </div>

            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="p-2.5 bg-gray-50 rounded-2xl flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-400 shrink-0">10 Oct 2023</span>
                <span className="text-[#102D20] text-right font-medium">Good yield with timely irrigation.</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-2xl flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-400 shrink-0">15 Aug 2022</span>
                <span className="text-[#102D20] text-right font-medium">Pest attack observed. Controlled with treatment.</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-2xl flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-400 shrink-0">20 Jul 2021</span>
                <span className="text-[#102D20] text-right font-medium">Low yield due to excess rainfall.</span>
              </div>
            </div>
          </div>

          {/* Compare with Similar Farms Card */}
          <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#07552F]">
              <Users className="w-5 h-5" />
              <h4 className="font-extrabold text-sm">Compare with Similar Farms</h4>
            </div>
            <p className="text-xs text-[#102D20] font-medium leading-relaxed">
              Your yield (4.8 t/acre) is <span className="font-bold text-[#087A3D]">12% higher</span> than the average yield in Bhimavaram region (4.3 t/acre).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
