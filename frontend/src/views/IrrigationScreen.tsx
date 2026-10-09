import React, { useState } from 'react';
import {
  ArrowLeft,
  Droplet,
  Check,
  ChevronRight,
  Sprout,
  Sun,
  CloudRain,
  Thermometer,
  Calendar,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface IrrigationScreenProps {
  farms?: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
}

export const IrrigationScreen: React.FC<IrrigationScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onBack,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy');
  const [waterSource, setWaterSource] = useState<string>('Canal');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [planData, setPlanData] = useState<any>(null);

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5 },
    { id: 2, village: 'Tanuku', acreage: 1.8 },
    { id: 3, village: 'Narsapuram', acreage: 3.2 },
    { id: 4, village: 'Eluru', acreage: 1.0 }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  const crops = [
    { id: 'Paddy', name: 'Paddy', color: 'amber' },
    { id: 'Maize', name: 'Maize', color: 'yellow' },
    { id: 'Groundnut', name: 'Groundnut', color: 'orange' },
    { id: 'Chilli', name: 'Chilli', color: 'red' },
    { id: 'Cotton', name: 'Cotton', color: 'slate' },
    { id: 'Turmeric', name: 'Turmeric', color: 'amber' },
    { id: 'Sugarcane', name: 'Sugarcane', color: 'green' },
    { id: 'Tomato', name: 'Tomato', color: 'red' },
    { id: 'Onion', name: 'Onion', color: 'purple' },
    { id: 'Red Gram', name: 'Red Gram', color: 'rose' },
    { id: 'Black Gram', name: 'Black Gram', color: 'slate' },
    { id: 'Green Gram', name: 'Green Gram', color: 'emerald' }
  ];

  const waterSources = [
    { id: 'Canal', name: 'Canal' },
    { id: 'Borewell', name: 'Borewell' },
    { id: 'Tank/Pond', name: 'Tank/Pond' },
    { id: 'Drip System', name: 'Drip System' }
  ];

  const handleGetPlan = async () => {
    setLoading(true);
    try {
      const data = await api.getIrrigationPlan(activeFarm.id || 1, selectedCrop, waterSource, "Vegetative Stage");
      setPlanData(data);
      setShowResults(true);
    } catch (err) {
      console.error("Irrigation plan error", err);
      setPlanData({
        crop: selectedCrop,
        stage: "Vegetative Stage",
        acreage: activeFarm.acreage || 2.5,
        depth_min: 25,
        depth_max: 30,
        volume_label: `≈ 1.6 – 1.9 lakh liters for ${activeFarm.acreage || 2.5} acres`,
        frequency_days: 5,
        next_date: "16 Aug 2024",
        temp: 32,
        rainfall_7d: 0,
        humidity: 58,
        weather: "Clear",
        why_recommendation: "No significant rainfall for the last 7 days and high temperature. Paddy at vegetative stage requires regular irrigation to maintain soil moisture.",
        additional_advice: [
          "Irrigate early morning or evening to reduce evaporation.",
          "Maintain field bunds to retain water.",
          "Avoid over-irrigation to prevent nutrient loss."
        ]
      });
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (showResults ? setShowResults(false) : onBack())}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#102D20]" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
          <Droplet className="w-6 h-6 fill-sky-500" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Smart Irrigation</h2>
          <p className="text-xs text-[#5A6E65]">
            {showResults ? 'Optimal irrigation for better yield' : 'Optimize water usage • Healthier crops'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {displayFarms.map((farm) => {
          const isSelected = activeFarm.id === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => onSelectFarm && onSelectFarm(farm as any)}
              className={`flex-none w-32 p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                isSelected
                  ? 'bg-white border-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#087A3D] shrink-0" />
              <div className="truncate">
                <h4 className="font-extrabold text-xs text-[#102D20] truncate">{farm.village}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{farm.acreage} acres</p>
              </div>
            </button>
          );
        })}
      </div>

      {!showResults ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#087A3D]" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Select Crop</h3>
            </div>
            <p className="text-xs text-gray-500">Choose the crop you want to irrigate</p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {crops.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`bg-white border rounded-2xl p-3 text-center transition-all relative flex flex-col items-center justify-center gap-2 shadow-2xs h-28 ${
                      isSelected
                        ? 'border-[#087A3D] bg-[#E7F7E4]/40 ring-2 ring-[#087A3D]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#087A3D] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    <CropIconMapper cropId={crop.id} />

                    <span className="font-extrabold text-xs text-[#102D20]">{crop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-sky-600" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Select Water Source</h3>
            </div>
            <p className="text-xs text-gray-500">Choose the main water source for this crop</p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {waterSources.map((source) => {
                const isSelected = waterSource === source.id;
                return (
                  <button
                    key={source.id}
                    onClick={() => setWaterSource(source.id)}
                    className={`bg-white border rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                      isSelected
                        ? 'border-[#087A3D] bg-[#E7F7E4] font-extrabold text-[#087A3D]'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <Droplet className={`w-5 h-5 ${isSelected ? 'text-[#087A3D]' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-bold leading-tight">{source.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGetPlan}
            disabled={loading}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mt-4"
          >
            <span>{loading ? 'Calculating Plan...' : 'Get Irrigation Plan'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <CropIconMapper cropId={planData?.crop || selectedCrop} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-[#102D20]">{planData?.crop || selectedCrop}</h3>
                  <span className="bg-[#E7F7E4] border border-green-300 text-[#087A3D] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    {planData?.stage || 'Vegetative Stage'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Field area: {planData?.acreage || activeFarm.acreage || 2.5} acres
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Sparkles className="w-4 h-4 text-[#087A3D]" />
                <span>Current Conditions</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                <MapPin className="w-3 h-3 text-[#087A3D]" />
                <span>{activeFarm.village || 'Bhimavaram'} • Updated: 10 Aug, 10:00 AM</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.temp || 32}°C</p>
                <p className="text-[10px] text-gray-500 font-medium">Temperature</p>
                <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">High</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <CloudRain className="w-5 h-5 text-sky-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.rainfall_7d || 0} mm</p>
                <p className="text-[10px] text-gray-500 font-medium">Rainfall (7d)</p>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Low</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Droplet className="w-5 h-5 text-emerald-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.humidity || 58}%</p>
                <p className="text-[10px] text-gray-500 font-medium">Humidity</p>
                <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Moderate</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Sun className="w-5 h-5 text-amber-400 fill-amber-300 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.weather || 'Clear'}</p>
                <p className="text-[10px] text-gray-500 font-medium">Weather</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500 fill-sky-400" />
                <h4 className="font-extrabold text-sm text-[#102D20]">Irrigation Recommendation</h4>
              </div>
              <span className="bg-green-100 text-[#087A3D] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-green-200">
                Optimized for current conditions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-semibold">Water Amount</p>
                <p className="text-xl font-black text-sky-700">
                  {planData?.depth_min || 25} – {planData?.depth_max || 30} mm
                </p>
                <p className="text-[10px] text-gray-500 font-medium">(per irrigation)</p>
                <p className="text-[10px] font-semibold text-gray-600 pt-0.5">
                  {planData?.volume_label || `≈ 1.6 – 1.9 lakh liters for ${activeFarm.acreage || 2.5} acres`}
                </p>
              </div>

              <div className="space-y-1 border-l border-gray-100 pl-3">
                <p className="text-[10px] text-gray-500 font-semibold">Irrigation Frequency</p>
                <p className="text-xl font-black text-[#087A3D]">
                  Every {planData?.frequency_days || 5} days
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-600 font-medium pt-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>Next irrigation: {planData?.next_date || '16 Aug 2024'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#087A3D]" />
              <h4 className="font-extrabold text-xs text-[#07552F]">Why this recommendation?</h4>
            </div>
            <p className="text-xs text-[#102D20] font-medium leading-relaxed">
              {planData?.why_recommendation || "No significant rainfall for the last 7 days and high temperature. Paddy at vegetative stage requires regular irrigation to maintain soil moisture."}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h4 className="font-extrabold text-sm text-[#102D20]">Additional Advice</h4>
            </div>

            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl">
                <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Irrigate early morning or evening to reduce evaporation.</span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl">
                <Sprout className="w-4 h-4 text-[#087A3D] shrink-0" />
                <span>Maintain field bunds to retain water.</span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Avoid over-irrigation to prevent nutrient loss.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
