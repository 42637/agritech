import React, { useState } from 'react';
import { ArrowLeft, MapPin, Layers, ShieldAlert, Thermometer, CloudRain, Wind } from 'lucide-react';
import type { Farm } from '../services/api';

interface ClimateMapScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onBack: () => void;
}

export const ClimateMapScreen: React.FC<ClimateMapScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onBack,
}) => {
  const [activeOverlay, setActiveOverlay] = useState<'heat' | 'rain' | 'wind'>('heat');

  const currentFarm = selectedFarm || farms[0] || {
    id: 1,
    village: 'Bhimavaram',
    district: 'West Godavari',
    latitude: 16.5449,
    longitude: 81.5212,
    acreage: 2.5
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20]">Climate Risk Map</h2>
            <p className="text-xs text-[#5A6E65]">Geospatial hazard visualization</p>
          </div>
        </div>
      </div>

      {/* Map Risk Overlay Switcher */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveOverlay('heat')}
          className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOverlay === 'heat' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-700'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" /> Heat Stress
        </button>
        <button
          onClick={() => setActiveOverlay('rain')}
          className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOverlay === 'rain' ? 'bg-sky-600 text-white shadow-xs' : 'text-gray-700'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" /> Heavy Rain
        </button>
        <button
          onClick={() => setActiveOverlay('wind')}
          className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOverlay === 'wind' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-700'
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> Strong Wind
        </button>
      </div>

      {/* Embedded Map Canvas */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs relative">
        <div className="w-full h-80 relative">
          <iframe
            title="Climate Risk Interactive Map"
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://maps.google.com/maps?q=${currentFarm.latitude},${currentFarm.longitude}&z=12&output=embed`}
            className="w-full h-full opacity-90"
          />

          {/* Risk Map Overlay Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200 text-xs shadow-md space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#102D20]">
              <Layers className="w-4 h-4 text-[#087A3D]" />
              <span>Active Layer: {activeOverlay.toUpperCase()}</span>
            </div>
            <p className="text-[10px] text-gray-500 font-semibold">
              {activeOverlay === 'heat' && 'High Temperature Alert (38 – 40°C)'}
              {activeOverlay === 'rain' && 'Heavy Rainfall Risk (50 – 70 mm)'}
              {activeOverlay === 'wind' && 'Wind Gust Warning (30 – 40 km/h)'}
            </p>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border text-[10px] font-bold shadow-md space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High Risk (Heatwave)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Medium Risk (Rain)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Low Risk (Normal)
            </div>
          </div>
        </div>

        {/* Selected Farm Information Bar */}
        <div className="p-4 bg-white border-t space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#087A3D]" />
              <h4 className="font-extrabold text-sm text-[#102D20]">{currentFarm.village}, {currentFarm.district}</h4>
            </div>
            <span className="text-xs font-bold text-[#087A3D] bg-[#E7F7E4] px-2.5 py-0.5 rounded-full border border-green-200">
              {currentFarm.acreage} Acres
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-bold text-center">
            {farms.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFarm(f)}
                className={`py-1.5 px-1 rounded-xl border transition-colors ${
                  f.id === currentFarm.id
                    ? 'bg-[#087A3D] text-white border-[#087A3D]'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f.village}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
