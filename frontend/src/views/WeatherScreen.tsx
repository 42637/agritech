import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  RotateCw,
  Volume2,
  CheckCircle2,
  Plus,
  Calendar,
  ChevronRight,
  Sprout,
  MapPin
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, WeatherData } from '../services/api';
import { voiceService } from '../services/voice';

interface WeatherScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onAddFarm: () => void;
  onBack: () => void;
}

export const WeatherScreen: React.FC<WeatherScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isPlayingReport, setIsPlayingReport] = useState(false);

  useEffect(() => {
    if (selectedFarm) {
      loadWeather(selectedFarm.id);
    }
  }, [selectedFarm]);

  const loadWeather = async (farmId: number) => {
    try {
      const data = await api.getWeather(farmId);
      setWeather(data);
    } catch (err) {
      console.error("Weather fetch failed, fallback active", err);
    }
  };

  const handleSpeakReport = (textToSpeak: string) => {
    if (isPlayingReport) {
      voiceService.stop();
      setIsPlayingReport(false);
    } else {
      setIsPlayingReport(true);
      voiceService.speak(textToSpeak, 'en', () => {
        setIsPlayingReport(false);
      });
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Top Header matching Reference Image 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Weather Updates</h2>
            <p className="text-xs text-[#5A6E65]">Live weather for your farms</p>
          </div>
        </div>
      </div>

      {/* Horizontal Farm Selector Carousel */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {farms.map((farm, index) => {
          const isSelected = selectedFarm?.id === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => onSelectFarm(farm)}
              className={`flex-none w-36 p-2.5 rounded-2xl border transition-all text-left relative flex items-center justify-between ${
                isSelected
                  ? 'bg-white border-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E7F7E4] flex items-center justify-center text-[#087A3D]">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#102D20] truncate">{farm.village}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">My Farm {index + 1}</p>
                </div>
              </div>

              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-[#087A3D] fill-[#087A3D]/20 shrink-0" />
              )}
            </button>
          );
        })}

        <button
          onClick={onAddFarm}
          className="flex-none w-28 p-2.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 text-xs font-bold text-gray-700"
        >
          <Plus className="w-4 h-4 text-[#087A3D]" />
          <span>Add Farm</span>
        </button>
      </div>

      {/* Main Weather Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-400 via-sky-300 to-emerald-200 text-white p-5 shadow-md">
        <div className="absolute top-2 right-4 opacity-30 pointer-events-none">
          <Sun className="w-24 h-24 text-amber-300 fill-amber-300" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 drop-shadow-xs">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>{weather?.village || selectedFarm?.village || 'Bhimavaram'}, {weather?.state || 'Andhra Pradesh'}</span>
              </div>
              <p className="text-[11px] text-slate-800 font-medium ml-5">
                Lat: {weather?.lat || selectedFarm?.latitude || 16.54}° N | Lon: {weather?.lon || selectedFarm?.longitude || 81.51}° E
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold bg-white/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
              <span>{weather?.updated_at || 'Updated Today 9:00 AM'}</span>
              <button onClick={() => selectedFarm && loadWeather(selectedFarm.id)} className="hover:rotate-180 transition-transform">
                <RotateCw className="w-3.5 h-3.5 text-slate-900" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {weather?.current_temp || 32}°C
                </span>
                <button
                  onClick={() => handleSpeakReport(weather?.audio_summary || "Current temperature is 32 degrees Celsius, partly sunny.")}
                  className="w-10 h-10 rounded-full bg-emerald-800/80 text-white flex items-center justify-center shadow-xs hover:bg-emerald-900 transition-colors"
                  title="Listen to Current Weather"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-lg font-extrabold text-slate-900 mt-1">{weather?.condition || 'Partly Sunny'}</p>
              <p className="text-xs font-semibold text-slate-800">Feels like {weather?.feels_like || 34}°C</p>
            </div>

            <div className="w-24 h-20 relative">
              <Sun className="w-14 h-14 text-amber-300 fill-amber-300 absolute top-0 right-2 animate-spin-slow" />
              <CloudSun className="w-16 h-16 text-white absolute bottom-0 left-0 drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Weather Metric Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
          <Droplets className="w-5 h-5 text-sky-500 mx-auto" />
          <p className="text-[10px] text-gray-500 font-medium mt-1">Rain Chance</p>
          <p className="font-extrabold text-sm text-[#102D20]">{weather?.rain_chance || 10}%</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
          <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
          <p className="text-[10px] text-gray-500 font-medium mt-1">Max Temp</p>
          <p className="font-extrabold text-sm text-rose-600">{weather?.max_temp || 32}°C</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
          <Thermometer className="w-5 h-5 text-sky-600 mx-auto" />
          <p className="text-[10px] text-gray-500 font-medium mt-1">Min Temp</p>
          <p className="font-extrabold text-sm text-sky-600">{weather?.min_temp || 24}°C</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
          <Wind className="w-5 h-5 text-teal-500 mx-auto" />
          <p className="text-[10px] text-gray-500 font-medium mt-1">Wind Speed</p>
          <p className="font-extrabold text-sm text-[#102D20]">{weather?.wind_speed || 12} km/h</p>
        </div>
      </div>

      {/* 7 Day Forecast Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#102D20]">7 Day Forecast</h3>
          <button className="text-xs font-bold text-[#087A3D] bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>View Details</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weather?.forecast.map((day, idx) => (
            <div
              key={idx}
              className={`flex-none w-20 bg-white border rounded-2xl p-2.5 text-center flex flex-col items-center justify-between shadow-2xs ${
                idx === 0 ? 'border-[#087A3D] bg-[#E7F7E4]/30' : 'border-gray-100'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-[#102D20]">{day.day}</p>
                <p className="text-[10px] text-gray-500">{day.date}</p>
              </div>

              <div className="my-1.5">
                {day.icon === 'rain' ? (
                  <CloudRain className="w-7 h-7 text-sky-500 mx-auto" />
                ) : day.icon === 'cloud' ? (
                  <CloudSun className="w-7 h-7 text-gray-400 mx-auto" />
                ) : (
                  <Sun className="w-7 h-7 text-amber-400 fill-amber-300 mx-auto" />
                )}
              </div>

              <div>
                <p className="font-bold text-xs text-rose-600">{day.max_temp}°</p>
                <p className="text-xs text-sky-600 font-semibold">{day.min_temp}°</p>
                <div className="flex items-center justify-center gap-0.5 text-[10px] text-sky-600 font-bold mt-1">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{day.rain_chance}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Weather Intelligence Cards */}
      <div className="space-y-2.5">
        {weather?.insights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs ${
              insight.type === 'warning'
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-[#E7F7E4]/80 border-green-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xs">
                {insight.icon === 'rain' ? (
                  <CloudRain className="w-6 h-6 text-sky-500" />
                ) : (
                  <Sprout className="w-6 h-6 text-[#087A3D]" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#102D20]">{insight.title}</h4>
                <p className="text-[11px] text-[#5A6E65] mt-0.5 leading-snug">{insight.message}</p>
              </div>
            </div>

            <button
              onClick={() => handleSpeakReport(`${insight.title}. ${insight.message}`)}
              className="px-2.5 py-1.5 rounded-full bg-white text-xs font-bold text-[#087A3D] border border-green-300 flex items-center gap-1 shadow-2xs shrink-0 hover:bg-green-50"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
        ))}
      </div>

      {/* Full Width Audio Report Action Button */}
      <button
        onClick={() => handleSpeakReport(weather?.audio_summary || "Full weather report...")}
        className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-between transition-colors mt-2"
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-sm">Listen to Full Weather Report</span>
        </div>
        <ChevronRight className="w-5 h-5 text-white/80" />
      </button>
    </div>
  );
};
