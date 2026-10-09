import React, { useState } from 'react';
import { Sprout, Phone, CheckCircle2, Navigation, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { Farm } from '../services/api';

interface LoginScreenProps {
  onLoginComplete: (farms: Farm[]) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginComplete }) => {
  const [step, setStep] = useState(1);
  const [farmerName, setFarmerName] = useState('Ramesh Kumar');
  const [phone, setPhone] = useState('+919876543210');

  const [farmsList, setFarmsList] = useState<Partial<Farm>[]>([
    {
      farm_name: 'Bhimavaram Farm',
      acreage: 2.5,
      latitude: 16.5449,
      longitude: 81.5212,
      pincode: '534201',
      village: 'Bhimavaram',
      mandal: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      soil_ph: 6.5
    }
  ]);

  const [currentFarmIndex, setCurrentFarmIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const currentFarm = farmsList[currentFarmIndex] || {};

  const handleUpdateCurrentFarm = (fields: Partial<Farm>) => {
    const updated = [...farmsList];
    updated[currentFarmIndex] = { ...updated[currentFarmIndex], ...fields };
    setFarmsList(updated);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          handleUpdateCurrentFarm({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            village: res.village,
            mandal: res.mandal,
            district: res.district,
            state: res.state,
            pincode: res.pincode || '534201'
          });
        } catch (err) {
          console.error(err);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert("GPS permission denied or unavailable. You can enter address manually.");
      }
    );
  };

  const handlePincodeLookup = async (pincode: string) => {
    handleUpdateCurrentFarm({ pincode });
    if (pincode.length === 6) {
      try {
        const data = await api.lookupPincode(pincode);
        handleUpdateCurrentFarm({
          village: data.village,
          mandal: data.mandal,
          district: data.district,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddAnotherFarm = () => {
    setFarmsList([
      ...farmsList,
      {
        farm_name: `Farm ${farmsList.length + 1}`,
        acreage: 1.5,
        latitude: 16.54,
        longitude: 81.51,
        pincode: '534201',
        village: 'Bhimavaram',
        mandal: 'Bhimavaram',
        district: 'West Godavari',
        state: 'Andhra Pradesh'
      }
    ]);
    setCurrentFarmIndex(farmsList.length);
  };

  const handleFinishRegistration = async () => {
    setLoading(true);
    try {
      const createdFarms: Farm[] = [];
      for (const f of farmsList) {
        const res = await api.createFarm(f);
        createdFarms.push(res);
      }
      onLoginComplete(createdFarms);
    } catch (err: any) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-green-100 rounded-3xl p-6 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center mx-auto shadow-sm">
            <Sprout className="w-8 h-8 fill-[#087A3D]" />
          </div>
          <h1 className="text-2xl font-black text-[#102D20]">AgriSmart AI</h1>
          <p className="text-xs text-[#5A6E65] font-semibold">Farmer Direct Login & Parcel Setup</p>

          <div className="flex justify-center gap-1.5 pt-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-8 bg-[#087A3D]' : step > i ? 'w-4 bg-green-300' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-base text-[#102D20]">Step 1: Farmer Details</h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Full Name</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Mobile Phone (+91)</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#087A3D] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07552F] transition-colors shadow-md"
            >
              <span>Continue to Farm Setup</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-extrabold text-base text-[#102D20]">
                Step 2: Farm Parcel ({currentFarmIndex + 1}/{farmsList.length})
              </h2>
              {farmsList.length > 1 && (
                <button
                  onClick={() => {
                    const filtered = farmsList.filter((_, i) => i !== currentFarmIndex);
                    setFarmsList(filtered);
                    setCurrentFarmIndex(Math.max(0, currentFarmIndex - 1));
                  }}
                  className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="w-full bg-[#E7F7E4] border border-green-300 text-[#087A3D] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-100 transition-colors shadow-2xs"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating GPS...' : '📍 Get My Location (GPS)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Farm Name</label>
                <input
                  type="text"
                  value={currentFarm.farm_name || ''}
                  onChange={(e) => handleUpdateCurrentFarm({ farm_name: e.target.value })}
                  placeholder="e.g. Bhimavaram Farm"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Acreage (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentFarm.acreage || 2.5}
                  onChange={(e) => handleUpdateCurrentFarm({ acreage: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">6-Digit Indian PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={currentFarm.pincode || ''}
                  onChange={(e) => handlePincodeLookup(e.target.value)}
                  placeholder="e.g. 534201"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-medium">Village</span>
                  <p className="font-bold text-[#102D20]">{currentFarm.village || 'Bhimavaram'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-medium">District</span>
                  <p className="font-bold text-[#102D20]">{currentFarm.district || 'West Godavari'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddAnotherFarm}
              className="w-full border border-dashed border-[#087A3D] text-[#087A3D] font-bold py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs hover:bg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Farm Parcel</span>
            </button>

            <button
              onClick={handleFinishRegistration}
              disabled={loading}
              className="w-full bg-[#087A3D] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07552F] transition-colors shadow-md mt-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Finalizing Setup...' : 'Finish & Launch Dashboard'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
