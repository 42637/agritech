import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Calendar,
  Droplet,
  Sprout,
  BarChart3,
  Sun,
  CloudRain,
  Thermometer,
  Lightbulb,
  AlertTriangle,
  MapPin,
  ArrowRight
} from 'lucide-react';
import type { Farm } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface CropRecommendationScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
  onNavigateToIrrigation?: (cropName: string) => void;
}

interface CropItem {
  id: string;
  name: string;
  suitability: 'High suitability' | 'Suitable' | 'Alternative option';
  suitabilityType: 'best' | 'good' | 'alternative';
  season: string;
  phRange: string;
  yieldEstimate: string;
  waterReq: string;
  bullets: string[];
  whyRecommended: string[];
  interCrops: { id: string; name: string; timing: string }[];
}

export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onBack,
  onNavigateToIrrigation
}) => {
  const [activeView, setActiveView] = useState<'main' | 'detail' | 'irrigation' | 'multicrop'>('main');
  const [filterTab, setFilterTab] = useState<'all' | 'best' | 'good' | 'alternative'>('best');
  const [detailCrop, setDetailCrop] = useState<CropItem | null>(null);
  const [detailTab, setDetailTab] = useState<'Overview' | 'Irrigation' | 'Season' | 'Past Data'>('Overview');
  const [selectedMultiCrops, setSelectedMultiCrops] = useState<string[]>(['Paddy', 'Maize', 'Groundnut']);
  const [waterSource, setWaterSource] = useState<string>('Canal');

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5 },
    { id: 2, village: 'Tanuku', acreage: 1.8 },
    { id: 3, village: 'Narsapuram', acreage: 3.2 },
    { id: 4, village: 'Eluru', acreage: 1.0 }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  const crops: CropItem[] = [
    {
      id: 'Paddy',
      name: 'Paddy',
      suitability: 'High suitability',
      suitabilityType: 'best',
      season: 'Jun – Oct (Kharif)',
      phRange: '6.0 – 7.5',
      yieldEstimate: '4.5 – 5.5 tons/acre',
      waterReq: '25 – 30 mm per irrigation',
      bullets: [
        'Current season',
        'Your soil pH (6.8)',
        'Good local yield history'
      ],
      whyRecommended: [
        'Suitable for current Kharif season',
        'Good yield history in your area',
        'Matches your soil pH (6.8)',
        'Good market demand'
      ],
      interCrops: [
        { id: 'Green Gram', name: 'Green Gram', timing: 'Before paddy (Apr – May)' },
        { id: 'Sesame', name: 'Sesame', timing: 'After paddy (Nov – Dec)' }
      ]
    },
    {
      id: 'Maize',
      name: 'Maize',
      suitability: 'Suitable',
      suitabilityType: 'good',
      season: 'Nov – Feb (Rabi)',
      phRange: '6.0 – 7.5',
      yieldEstimate: '3.8 – 4.5 tons/acre',
      waterReq: '20 – 25 mm per irrigation',
      bullets: [
        'Good for this season',
        'Tolerant to soil conditions',
        'Moderate water requirement'
      ],
      whyRecommended: [
        'Excellent follow-up crop after paddy',
        'Low pest risk in Rabi season',
        'High demand for poultry feed industry',
        'Efficient nitrogen utilization'
      ],
      interCrops: [
        { id: 'Red Gram', name: 'Red Gram', timing: 'Intercrop (Jun – Oct)' },
        { id: 'Black Gram', name: 'Black Gram', timing: 'Post-harvest (Feb – Apr)' }
      ]
    },
    {
      id: 'Chilli',
      name: 'Chilli',
      suitability: 'Suitable',
      suitabilityType: 'good',
      season: 'Aug – Mar',
      phRange: '6.0 – 7.0',
      yieldEstimate: '2.5 – 3.2 tons/acre',
      waterReq: '18 – 22 mm per irrigation',
      bullets: [
        'High market demand',
        'Perform well in this region',
        'Requires moderate irrigation'
      ],
      whyRecommended: [
        'High commercial return in local markets',
        'Suitable for well-drained loamy soil',
        'Good resistance to local heat waves',
        'Strong export price stability'
      ],
      interCrops: [
        { id: 'Onion', name: 'Onion', timing: 'Border crop' },
        { id: 'Green Gram', name: 'Green Gram', timing: 'Intercrop' }
      ]
    },
    {
      id: 'Groundnut',
      name: 'Groundnut',
      suitability: 'Alternative option',
      suitabilityType: 'alternative',
      season: 'Mar – May (Pre-summer)',
      phRange: '6.0 – 7.0',
      yieldEstimate: '1.8 – 2.4 tons/acre',
      waterReq: '15 – 20 mm per irrigation',
      bullets: [
        'Works in your soil type',
        'Lower water requirement',
        'Can be used as mid crop'
      ],
      whyRecommended: [
        'Fixes soil nitrogen naturally',
        'Ideal short-duration summer crop',
        'Requires minimal pesticide input',
        'High oil extraction value'
      ],
      interCrops: [
        { id: 'Maize', name: 'Maize', timing: 'Strip crop' },
        { id: 'Red Gram', name: 'Red Gram', timing: 'Row intercrop' }
      ]
    }
  ];

  const filteredCrops = filterTab === 'all'
    ? crops
    : crops.filter((c) => c.suitabilityType === filterTab);

  const toggleMultiCrop = (cropId: string) => {
    if (selectedMultiCrops.includes(cropId)) {
      if (selectedMultiCrops.length > 1) {
        setSelectedMultiCrops(selectedMultiCrops.filter((id) => id !== cropId));
      }
    } else {
      if (selectedMultiCrops.length < 3) {
        setSelectedMultiCrops([...selectedMultiCrops, cropId]);
      }
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: MAIN CROP RECOMMENDATIONS LIST SCREEN
  // -------------------------------------------------------------
  if (activeView === 'main') {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
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
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Crop Recommendations</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">Right crops for your land, season and conditions</p>
            </div>
          </div>
        </div>

        {/* Location Selector Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {displayFarms.map((farm) => {
            const isSelected = activeFarm.id === farm.id;
            return (
              <button
                key={farm.id}
                onClick={() => onSelectFarm && onSelectFarm(farm as any)}
                className={`flex-none px-3 py-1.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  isSelected
                    ? 'bg-[#E7F7E4] border-[#087A3D] text-[#087A3D] ring-2 ring-[#087A3D]/20'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 fill-current" />
                <span>{farm.village}</span>
              </button>
            );
          })}
        </div>

        {/* Current Season Banner */}
        <div className="bg-[#FFFBEB] border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/70 flex items-center justify-center text-amber-600 shrink-0">
              <Sun className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102D20]">Current Season</p>
              <p className="text-xs text-amber-800 font-semibold">Kharif (Jun – Oct)</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* Section Heading & Filters */}
        <div className="space-y-2.5 pt-1">
          <div>
            <h3 className="font-black text-base text-[#102D20]">Recommended Crops</h3>
            <p className="text-xs text-gray-500 font-medium">Based on your soil pH, local climate, past data and market trends</p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setFilterTab('best')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'best'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Best Match
            </button>
            <button
              onClick={() => setFilterTab('good')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'good'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Good Option
            </button>
            <button
              onClick={() => setFilterTab('alternative')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'alternative'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alternative
            </button>
          </div>
        </div>

        {/* Crop Cards List */}
        <div className="space-y-3">
          {filteredCrops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => {
                setDetailCrop(crop);
                setActiveView('detail');
              }}
              className={`bg-white border rounded-3xl p-4 shadow-xs hover:border-[#087A3D] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                crop.suitabilityType === 'best' ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="shrink-0 mt-0.5">
                  <CropIconMapper cropId={crop.id} size="lg" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-[#102D20]">{crop.name}</h4>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        crop.suitabilityType === 'best'
                          ? 'bg-[#E7F7E4] text-[#087A3D] border-green-200'
                          : crop.suitabilityType === 'good'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {crop.suitability}
                    </span>
                  </div>

                  <ul className="space-y-0.5 text-xs text-gray-600 font-medium">
                    {crop.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <Check className="w-3.5 h-3.5 text-[#087A3D] stroke-[2.5]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>

        {/* View Multi-Crop Plan Action Button */}
        <div className="pt-2">
          <button
            onClick={() => setActiveView('multicrop')}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            <span>View Multi-Crop Plan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: CROP DETAIL SCREEN (e.g., Paddy detail)
  // -------------------------------------------------------------
  if (activeView === 'detail' && detailCrop) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('main')} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-[#102D20]" />
            </button>
            <CropIconMapper cropId={detailCrop.id} />
            <div>
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">{detailCrop.name}</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">Crop insights for better planning</p>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {(['Overview', 'Irrigation', 'Season', 'Past Data'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                detailTab === tab
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Why Recommended Card */}
        <div className="bg-[#E7F7E4]/80 border border-green-200 rounded-3xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-[#07552F]">
            <Sprout className="w-5 h-5" />
            <h3 className="font-extrabold text-sm">Why Recommended?</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-[#102D20] font-semibold">
            {detailCrop.whyRecommended.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-2.5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Growing Season</p>
                <p className="font-extrabold text-sm text-[#102D20]">{detailCrop.season}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Water Requirement</p>
                <p className="font-extrabold text-sm text-[#102D20]">{detailCrop.waterReq}</p>
                <p className="text-[10px] text-gray-500 font-medium">Moderate water requirement</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-700">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Suitable Soil pH</p>
                <p className="font-extrabold text-sm text-[#102D20]">{detailCrop.phRange}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Your soil pH: 6.8 <span className="text-[#087A3D] font-bold">✓ (Suitable)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Expected Yield (Your Area)</p>
                <p className="font-extrabold text-sm text-[#102D20]">{detailCrop.yieldEstimate}</p>
                <p className="text-[10px] text-gray-500 font-medium">Based on historical data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Can be Grown With (Inter/Mid Crops) */}
        <div className="space-y-2 pt-1">
          <h4 className="font-extrabold text-sm text-[#102D20]">Can be Grown With (Inter/Mid Crops)</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {detailCrop.interCrops.map((ic) => (
              <div key={ic.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
                <CropIconMapper cropId={ic.id} />
                <div>
                  <p className="font-extrabold text-xs text-[#102D20]">{ic.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{ic.timing}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (onNavigateToIrrigation) {
                onNavigateToIrrigation(detailCrop.name);
              } else {
                setActiveView('irrigation');
              }
            }}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            <span>Get Irrigation Plan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: IRRIGATION PLAN SCREEN (Reference Image Screen 3)
  // -------------------------------------------------------------
  if (activeView === 'irrigation') {
    const crop = detailCrop || crops[0];
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('detail')} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-[#102D20]" />
            </button>
            <CropIconMapper cropId={crop.id} />
            <div>
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Irrigation Plan</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">Optimized for your field and weather</p>
            </div>
          </div>
        </div>

        {/* Selected Crop Pill */}
        <div className="bg-white border border-gray-100 rounded-3xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <CropIconMapper cropId={crop.id} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-[#102D20]">{crop.name}</h4>
                <span className="bg-[#E7F7E4] text-[#087A3D] font-bold text-[10px] px-2 py-0.5 rounded-full border border-green-200">
                  Suitable
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{crop.season}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('main')}
            className="text-xs font-bold text-[#087A3D] hover:underline"
          >
            Change
          </button>
        </div>

        {/* Weather & Water Availability Grid */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm text-[#102D20]">Weather & Water Availability</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">32°C</p>
              <p className="text-[10px] text-gray-500 font-medium">Temperature</p>
              <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">High</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <CloudRain className="w-5 h-5 text-sky-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">0 mm</p>
              <p className="text-[10px] text-gray-500 font-medium">Recent Rainfall</p>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Low</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Droplet className="w-5 h-5 text-emerald-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">58%</p>
              <p className="text-[10px] text-gray-500 font-medium">Humidity</p>
              <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Moderate</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Sun className="w-5 h-5 text-amber-400 fill-amber-300 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">Clear</p>
              <p className="text-[10px] text-gray-500 font-medium">Weather</p>
            </div>
          </div>
        </div>

        {/* Water Source Selector */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm text-[#102D20]">Water Source</h4>
          <div className="grid grid-cols-4 gap-2">
            {['Canal', 'Borewell', 'Tank/Pond', 'Drip'].map((src) => {
              const isSel = waterSource === src;
              return (
                <button
                  key={src}
                  onClick={() => setWaterSource(src)}
                  className={`bg-white border rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                    isSel
                      ? 'border-[#087A3D] bg-[#E7F7E4] font-extrabold text-[#087A3D]'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <Droplet className={`w-5 h-5 ${isSel ? 'text-[#087A3D]' : 'text-gray-400'}`} />
                  <span className="text-[11px] font-bold leading-tight">{src}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Irrigation Recommendation */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-sky-500 fill-sky-400" />
            <h4 className="font-extrabold text-sm text-[#102D20]">Irrigation Recommendation</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold">Water Amount</p>
              <p className="text-xl font-black text-sky-700">25 – 30 mm</p>
              <p className="text-[10px] text-gray-500 font-medium">(~1.8 lakh liters / 2.5 acres)</p>
            </div>

            <div className="border-l border-gray-100 pl-3">
              <p className="text-[10px] text-gray-500 font-semibold">Frequency</p>
              <p className="text-xl font-black text-[#087A3D]">Every 5 days</p>
              <p className="text-[10px] text-gray-500 font-medium">Next: 16 Aug</p>
            </div>
          </div>
        </div>

        {/* Why this plan? */}
        <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#07552F]">
            <Sprout className="w-5 h-5" />
            <h4 className="font-extrabold text-xs">Why this plan?</h4>
          </div>
          <p className="text-xs text-[#102D20] font-medium leading-relaxed">
            High temperature and no recent rainfall. Paddy at vegetative stage needs regular irrigation to maintain soil moisture.
          </p>
        </div>

        {/* Additional Tips */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h4 className="font-extrabold text-sm text-[#102D20]">Additional Tips</h4>
          </div>

          <ul className="space-y-2 text-xs font-semibold text-gray-700">
            <li className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Irrigate early morning or evening.</span>
            </li>
            <li className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#087A3D] shrink-0" />
              <span>Maintain field bunds to reduce water loss.</span>
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Avoid over-irrigation.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 4: MULTI-CROP PLAN SCREEN (Reference Image Screen 4)
  // -------------------------------------------------------------
  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView('main')} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center p-1 shadow-2xs">
            <svg viewBox="0 0 48 48" className="w-8 h-8">
              <path d="M8 38 Q24 24 40 38 Q32 44 24 44 Q16 44 8 38 Z" fill="#6E4729" />
              <path d="M24 35 C24 26 23 20 22 14" stroke="#15803D" strokeWidth="3.5" fill="none" />
              <path d="M23 22 C13 18 9 9 17 7 C23 7 24 16 23 22 Z" fill="#22C55E" />
              <path d="M23 18 C33 14 37 5 29 3 C23 3 22 12 23 18 Z" fill="#15803D" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Multi-Crop Plan</h2>
            <p className="text-xs text-[#5A6E65] font-semibold">Plan crops across seasons for better income</p>
          </div>
        </div>
      </div>

      {/* Your Interest Crop Selector Grid */}
      <div className="space-y-2">
        <div>
          <h3 className="font-extrabold text-sm text-[#102D20]">Your Interest</h3>
          <p className="text-xs text-gray-500 font-medium">Select up to 3 crops</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['Paddy', 'Maize', 'Chilli', 'Groundnut', 'Turmeric', 'Cotton'].map((cropId) => {
            const isSel = selectedMultiCrops.includes(cropId);
            return (
              <button
                key={cropId}
                onClick={() => toggleMultiCrop(cropId)}
                className={`bg-white border rounded-2xl p-3 text-center transition-all relative flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                  isSel
                    ? 'border-[#087A3D] bg-[#E7F7E4]/50 ring-2 ring-[#087A3D]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    isSel ? 'bg-[#087A3D] text-white' : 'border border-gray-300 bg-white'
                  }`}
                >
                  {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <CropIconMapper cropId={cropId} />
                <span className="font-extrabold text-xs text-[#102D20]">{cropId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Plan Timeline (Next 1 Year) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="font-extrabold text-sm text-[#102D20]">Recommended Plan (Next 1 Year)</h3>

        <div className="space-y-3 relative pl-3 border-l-2 border-dashed border-gray-200 ml-3">
          {/* Kharif */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <CropIconMapper cropId="Paddy" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Kharif (Jun – Oct)</p>
                  <h4 className="font-extrabold text-base text-[#102D20]">Paddy</h4>
                  <p className="text-[10px] text-amber-800 font-semibold">Main crop</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Rabi */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <CropIconMapper cropId="Maize" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Rabi (Nov – Feb)</p>
                  <h4 className="font-extrabold text-base text-[#102D20]">Maize</h4>
                  <p className="text-[10px] text-amber-800 font-semibold">Follow-up crop</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Pre-summer */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-orange-400 ring-4 ring-orange-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <CropIconMapper cropId="Groundnut" />
                <div>
                  <p className="text-[10px] font-bold text-orange-700 uppercase">Pre-summer (Mar – May)</p>
                  <h4 className="font-extrabold text-base text-[#102D20]">Groundnut</h4>
                  <p className="text-[10px] text-amber-800 font-semibold">Mid crop (optional)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Why this plan? Card */}
      <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-[#07552F]">
          <Sprout className="w-5 h-5" />
          <h4 className="font-extrabold text-sm">Why this plan?</h4>
        </div>

        <ul className="space-y-1.5 text-xs text-[#102D20] font-semibold">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Matches your soil pH (6.8)</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Suitable for local climate and water availability</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Based on historical yield data of your area</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Helps maintain soil fertility</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Provides better year-round income</span>
          </li>
        </ul>
      </div>

      {/* Bottom Save Plan Action Button */}
      <div className="pt-2">
        <button
          onClick={() => setActiveView('main')}
          className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
        >
          <span>Save Plan</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
