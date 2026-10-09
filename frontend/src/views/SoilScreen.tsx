import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sprout,
  ChevronDown,
  Lock,
  FlaskConical,
  Info,
  Pencil,
  Settings,
  Droplet,
  CloudRain,
  Sun,
  Package,
  Lightbulb,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, SoilData } from '../services/api';

interface SoilScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onBack: () => void;
}

export const SoilScreen: React.FC<SoilScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onBack,
}) => {
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [inputPh, setInputPh] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  useEffect(() => {
    if (selectedFarm) {
      loadSoil(selectedFarm.id);
    }
  }, [selectedFarm]);

  const loadSoil = async (farmId: number) => {
    setLoading(true);
    try {
      const data = await api.getSoil(farmId);
      setSoilData(data);
      if (data.has_ph && data.ph !== undefined) {
        setInputPh(data.ph.toString());
      } else {
        setInputPh('');
      }
    } catch (err) {
      console.error("Soil fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePh = async () => {
    if (!selectedFarm) return;
    const phVal = parseFloat(inputPh);

    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      setErrorMsg("Please enter a valid soil pH value between 0.0 and 14.0");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const updated = await api.updateSoilPh(selectedFarm.id, phVal);
      setSoilData(updated);
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save soil pH");
    } finally {
      setLoading(false);
    }
  };

  const currentPh = soilData?.ph ?? 6.5;
  const scalePercent = Math.min(Math.max(((currentPh - 4.5) / 4.0) * 100, 0), 100);

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Soil Intelligence</h2>
            <p className="text-xs text-[#5A6E65]">Know your soil • Grow better</p>
          </div>
        </div>
      </div>

      {/* Selected Farm Dropdown */}
      <div className="relative">
        <div className="w-full bg-[#E7F7E4]/70 border border-green-200 rounded-2xl px-4 py-2.5 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#087A3D] text-white flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedFarm?.id}
              onChange={(e) => {
                const farm = farms.find((f) => f.id === Number(e.target.value));
                if (farm) onSelectFarm(farm);
              }}
              className="bg-transparent font-bold text-sm text-[#102D20] focus:outline-hidden appearance-none pr-6 cursor-pointer"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} ({farm.village})
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-[#087A3D] pointer-events-none" />
        </div>
      </div>

      {/* STATE A: BEFORE SOIL pH IS SAVED */}
      {(!soilData?.has_ph || isEditing) ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-green-100 shadow-xs overflow-hidden text-center space-y-4 pb-5">
            <div className="w-full h-52 relative overflow-hidden">
              <img
                src="/assets/soil_hero_real.jpg"
                alt="Soil Intelligence Hero"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="px-5 space-y-1.5">
              <h3 className="text-xl font-black text-[#102D20]">
                Unlock your soil insights
              </h3>
              <p className="text-xs font-semibold text-[#5A6E65] max-w-xs mx-auto leading-relaxed">
                Enter a soil pH value from a recent soil test to get farm-specific guidance.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900">Soil analysis unlocks after pH is saved.</h4>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                We use pH along with soil type, water availability, rainfall, season, past crops and recent fertilizers to provide better recommendations.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[#102D20] flex items-center gap-1.5">
                <span>Soil pH Value</span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </label>
              <span className="text-[11px] font-semibold text-gray-500">Typical scale: 0 - 14</span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={inputPh}
                onChange={(e) => setInputPh(e.target.value)}
                placeholder="e.g. 6.5"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-base font-bold text-[#102D20] focus:outline-hidden focus:border-[#087A3D] focus:ring-2 focus:ring-[#087A3D]/20 transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            <p className="text-[11px] text-gray-500 leading-snug">
              Enter the pH value from your latest soil test report (or from a nearby soil testing lab).
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleSavePh}
              disabled={loading}
              className="w-full bg-[#087A3D] hover:bg-[#07552F] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <span>{loading ? 'Saving...' : 'Save pH & Continue'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="w-full bg-white hover:bg-gray-50 border border-green-300 text-[#087A3D] font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How do I test soil pH?</span>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
            </button>
          </div>
        </div>
      ) : (
        /* STATE B: AFTER SOIL pH IS SAVED */
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#102D20]">
                  <span>Soil pH (Your farm)</span>
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-[#102D20]">{soilData?.ph}</span>
                  <span className="text-xs font-bold bg-[#E7F7E4] text-[#087A3D] px-2.5 py-0.5 rounded-full border border-green-200">
                    Saved value
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">
                  {soilData?.ph_status}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] text-gray-400 font-medium">
                  Last updated {soilData?.last_updated || '12 Aug 2024'}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors"
                  title="Edit pH"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-green-500 to-blue-600">
                <div
                  className="absolute -top-2 w-4 h-4 bg-slate-900 border-2 border-white rounded-full shadow-md -translate-x-1/2"
                  style={{ left: `${scalePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1.5 px-1">
                <span>4.5</span>
                <span>5.5</span>
                <span>6.5</span>
                <span>7.5</span>
                <span>8.5</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Settings className="w-4 h-4 text-[#087A3D]" />
                <span>Farm factors considered</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#087A3D] hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                <span>Update farm details</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Soil type</p>
                  <p className="font-bold text-xs text-[#102D20]">{soilData?.farm_factors?.soil_type || 'Loamy'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Water availability</p>
                  <p className="font-bold text-xs text-[#102D20]">{soilData?.farm_factors?.water_availability || 'Moderate'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Recent rainfall</p>
                  <p className="font-bold text-xs text-[#102D20]">{soilData?.farm_factors?.recent_rainfall || '42 mm (last 30 days)'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600 shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Season</p>
                  <p className="font-bold text-xs text-[#102D20]">{soilData?.farm_factors?.season || 'Kharif (Jun - Sep)'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Past crops</p>
                  <p className="font-bold text-xs text-[#102D20] truncate">{soilData?.farm_factors?.past_crops || 'Paddy, Maize'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Recent fertilizers</p>
                  <p className="font-bold text-xs text-[#102D20] truncate">{soilData?.farm_factors?.recent_fertilizers || 'Urea, DAP'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Soil guidance</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Depends on crop & local conditions</span>
            </div>

            <div className="space-y-2">
              {soilData?.guidance?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-amber-100 flex items-center justify-between hover:border-amber-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center shrink-0 mt-0.5">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#102D20]">{item.title}</h5>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.message}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Sprout className="w-4 h-4 text-[#087A3D]" />
                <span>Recommended crops for your farm</span>
              </div>
              <button className="text-xs font-bold text-[#087A3D] hover:underline">View all &gt;</button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {soilData?.recommended_crops?.slice(0, 3).map((crop) => (
                <div
                  key={crop.id}
                  className="bg-white border border-gray-100 rounded-2xl p-3 text-left shadow-2xs hover:border-green-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 mb-2">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#102D20]">{crop.name}</h4>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2">
                      {crop.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-[#102D20]">How do I test soil pH?</h3>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 font-medium">
              <li>Collect 5-6 soil samples from V-shaped pits (15cm deep) across your farm.</li>
              <li>Mix samples thoroughly in a clean plastic container and dry under shade.</li>
              <li>Take sample to nearest District Krishi Vigyan Kendra (KVK) or soil testing lab.</li>
              <li>Alternatively, use a calibrated digital soil pH meter with distilled water slurry.</li>
            </ol>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#087A3D] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
