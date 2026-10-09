import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Bell,
  Thermometer,
  CloudRain,
  Sun,
  Wind,
  Bug,
  Map,
  ChevronRight,
  Lightbulb,
  Sprout,
  Plus
} from 'lucide-react';
import type { Farm } from '../services/api';

interface AlertsScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onAddFarm?: () => void;
  onBack: () => void;
  onViewMap?: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
  onViewMap
}) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('today');

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5 },
    { id: 2, village: 'Tanuku', acreage: 1.8 },
    { id: 3, village: 'Narsapuram', acreage: 3.2 },
    { id: 4, village: 'Eluru', acreage: 1.0 }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarmId = selectedFarm?.id || displayFarms[0]?.id;

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header bar matching Reference Image 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Climate Risk Alerts</h2>
            <p className="text-xs text-[#5A6E65]">Be prepared • Protect your crops</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-semibold text-[#102D20]">
            <span className="mr-1 text-xs">🌐</span>
            <span>English</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-500" />
          </div>
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Horizontal Farm Selector Carousel */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {displayFarms.map((farm) => {
          const isSelected = activeFarmId === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => onSelectFarm && onSelectFarm(farm as any)}
              className={`flex-none w-32 p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-[#E7F7E4] border-[#087A3D] ring-2 ring-[#087A3D]/20'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#087A3D] shadow-2xs">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="font-extrabold text-xs text-[#102D20] truncate">{farm.village}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{farm.acreage} acres</p>
              </div>
            </button>
          );
        })}

        <button
          onClick={onAddFarm}
          className="flex-none w-24 p-2.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-0.5 text-xs font-bold text-gray-700"
        >
          <Plus className="w-4 h-4 text-[#087A3D]" />
          <span className="text-[10px]">Add Farm</span>
        </button>
      </div>

      {/* Forecast-Period Selector Pill Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setPeriod('today')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === 'today'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setPeriod('7days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '7days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Next 7 Days
        </button>
        <button
          onClick={() => setPeriod('30days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '30days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Next 30 Days
        </button>
      </div>

      {/* Featured Climate Risk Card (Pale Pink Container) */}
      <div className="bg-[#FFF0F0] border border-rose-200/90 rounded-3xl p-4 space-y-3 shadow-2xs relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Thermometer className="w-7 h-7" />
            </div>

            <div>
              <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                High Risk
              </span>
              <h3 className="font-black text-base text-[#102D20] mt-1 leading-tight">
                High Temperature Expected
              </h3>
              <p className="text-xs text-gray-500 font-semibold">13 – 15 Aug (Next 3 days)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5 pt-1 items-center">
          <div className="col-span-2">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Expected Temp</p>
            <p className="text-2xl font-black text-rose-600 tracking-tight">38–40°C</p>
            <p className="text-[10px] text-gray-500 font-semibold">(Normal: 32°C)</p>
            <p className="text-[10px] text-gray-700 leading-snug font-medium mt-1">
              High heat stress may affect crop growth.
            </p>
          </div>

          <div className="col-span-3 h-28 relative rounded-2xl overflow-hidden shadow-2xs border border-rose-200/80 bg-[#FFF5EB] flex items-center justify-center">
            <img
              src="/assets/high_heat_alert_hero.png"
              alt="High Temperature Extreme Risk"
              className="w-full h-full object-contain object-center"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-rose-100 flex items-center justify-between text-xs font-semibold text-[#102D20] shadow-2xs">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="font-bold">What to do?</span>
            <span className="text-gray-600 truncate max-w-[180px]">Irrigate early morning or evening to reduce heat stress.</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <h3 className="font-extrabold text-sm text-[#102D20]">Other Upcoming Risks</h3>
        <button
          onClick={onViewMap}
          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#087A3D] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          <span>View on Map</span>
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="bg-sky-50/80 border border-sky-200/90 rounded-3xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-sky-500 shrink-0 shadow-2xs">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                Medium Risk
              </span>
              <h4 className="font-extrabold text-xs text-[#102D20] mt-0.5">Heavy Rainfall</h4>
              <p className="text-[10px] text-gray-500 font-medium">14 Aug (In 2 days)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="font-black text-sm text-sky-700 block">50 – 70 mm</span>
              <span className="text-[10px] text-gray-500 font-medium">Higher chance of rainfall.</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
              <Sun className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <span className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                Medium Risk
              </span>
              <h4 className="font-extrabold text-xs text-[#102D20] mt-0.5">Dry Conditions</h4>
              <p className="text-[10px] text-gray-500 font-medium">No significant rain for 2 months</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right max-w-[120px]">
              <span className="text-[10px] text-gray-600 font-medium leading-tight block">
                Soil moisture is low. Plan irrigation accordingly.
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>

        <div className="bg-sky-50/50 border border-sky-100 rounded-3xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-teal-600 shrink-0 shadow-2xs">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-green-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                Low Risk
              </span>
              <h4 className="font-extrabold text-xs text-[#102D20] mt-0.5">Strong Wind</h4>
              <p className="text-[10px] text-gray-500 font-medium">16 Aug (In 4 days)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] text-gray-600 font-medium block">Wind speed may reach</span>
              <span className="font-extrabold text-xs text-[#102D20]">30 – 40 km/h.</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>

        <div className="bg-[#E7F7E4]/70 border border-green-200/80 rounded-3xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#087A3D] shrink-0 shadow-2xs">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-green-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                Low Risk
              </span>
              <h4 className="font-extrabold text-xs text-[#102D20] mt-0.5">Pest/Disease Risk</h4>
              <p className="text-[10px] text-gray-500 font-medium">Favorable conditions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right max-w-[130px]">
              <span className="text-[10px] text-gray-600 font-medium block">High humidity may increase pest activity.</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
