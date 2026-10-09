import React from 'react';
import { ArrowLeft, Sprout } from 'lucide-react';
import type { Farm } from '../services/api';

interface CropRecommendationScreenProps {
  selectedFarm: Farm | null;
  onBack: () => void;
}

export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({ onBack }) => {
  const crops = [
    { name: "Paddy (MTU 1061 / BPT 5204)", ph: "5.5 - 7.0", suitability: "High", reason: "Ideal for clay-loam soils and canal water availability in West Godavari." },
    { name: "Maize (Hybrid DHM-117)", ph: "6.0 - 7.5", suitability: "High", reason: "Excellent yield for Kharif season with low water demand." },
    { name: "Groundnut (K-6 / Kadiri)", ph: "6.0 - 7.0", suitability: "Moderate", reason: "Suitable for well-drained sandy loam parcels." },
    { name: "Chilli (Guntur Hope)", ph: "6.0 - 7.0", suitability: "High", reason: "High commercial return in Andhra Pradesh markets." }
  ];

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-[#102D20]" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20]">Crop Recommendation</h2>
          <p className="text-xs text-[#5A6E65]">Find the best crops for your farm</p>
        </div>
      </div>

      <div className="space-y-3">
        {crops.map((crop, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#102D20]">{crop.name}</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-[#087A3D]">
                {crop.suitability} Suitability
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-snug">{crop.reason}</p>
            <div className="text-[11px] text-gray-500 font-medium pt-1">
              Preferred Soil pH: <span className="font-bold text-[#102D20]">{crop.ph}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
