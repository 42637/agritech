import React from 'react';
import { Sprout, MapPin, Plus, Trash2, Compass } from 'lucide-react';
import type { Farm } from '../services/api';

interface MyFarmScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onAddFarm: () => void;
  onDeleteFarm: (id: number) => void;
}

export const MyFarmScreen: React.FC<MyFarmScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onDeleteFarm,
}) => {
  const totalAcreage = farms.reduce((sum, f) => sum + (f.acreage || 0), 0);

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Summary Header Card */}
      <div className="bg-gradient-to-br from-[#07552F] to-[#087A3D] rounded-3xl p-5 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-green-200 font-semibold uppercase tracking-wider">Total Registered Area</span>
            <h2 className="text-3xl font-black mt-0.5 tracking-tight">
              {totalAcreage.toFixed(2)} <span className="text-lg font-bold text-green-200">Acres</span>
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            <Sprout className="w-7 h-7" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs text-green-100 font-medium">
          <span>{farms.length} Farm Parcels Registered</span>
          <span>1 acre = 0.4047 Hectares</span>
        </div>
      </div>

      {/* Map View Frame */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs space-y-2">
        <div className="px-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
            <Compass className="w-4 h-4 text-[#087A3D]" />
            <span>Farm GPS Map</span>
          </div>
          <span className="text-[10px] text-gray-500 font-semibold">Verified Coordinates</span>
        </div>

        <div className="w-full h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden border-y border-gray-100">
          <iframe
            title="Farm Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://maps.google.com/maps?q=${selectedFarm?.latitude || 16.5449},${selectedFarm?.longitude || 81.5212}&z=13&output=embed`}
            className="w-full h-full opacity-90"
          />

          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200 text-[10px] font-bold text-[#102D20] shadow-xs">
            {selectedFarm?.village || 'Bhimavaram'} ({selectedFarm?.latitude.toFixed(4)}°N, {selectedFarm?.longitude.toFixed(4)}°E)
          </div>
        </div>
      </div>

      {/* Parcels List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#102D20]">Your Land Parcels</h3>
          <button
            onClick={onAddFarm}
            className="text-xs font-bold text-[#087A3D] bg-green-50 border border-green-200 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-green-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Parcel</span>
          </button>
        </div>

        {farms.map((farm, idx) => {
          const isSelected = selectedFarm?.id === farm.id;
          return (
            <div
              key={farm.id}
              onClick={() => onSelectFarm(farm)}
              className={`bg-white border rounded-3xl p-4 shadow-2xs transition-all space-y-3 cursor-pointer ${
                isSelected ? 'border-[#087A3D] ring-2 ring-[#087A3D]/20' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#102D20]">{farm.farm_name}</h4>
                    <div className="flex items-center gap-1 text-xs text-[#5A6E65] font-medium mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#087A3D]" />
                      <span>{farm.village}, {farm.district}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-[#087A3D]">{farm.acreage}</span>
                  <span className="text-xs font-semibold text-gray-500 ml-1">Acres</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-[11px]">
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 font-medium block text-[9px]">Soil pH</span>
                  <span className="font-extrabold text-[#102D20]">{farm.soil_ph ? farm.soil_ph : 'Not set'}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 font-medium block text-[9px]">Soil Type</span>
                  <span className="font-extrabold text-[#102D20]">{farm.soil_type || 'Loamy'}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 font-medium block text-[9px]">Crop</span>
                  <span className="font-extrabold text-[#102D20]">{farm.current_crops || 'Paddy'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400 font-medium">PIN: {farm.pincode}</span>
                {farms.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete ${farm.farm_name}?`)) {
                        onDeleteFarm(farm.id);
                      }
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Parcel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
