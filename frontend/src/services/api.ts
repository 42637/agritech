import { Capacitor } from '@capacitor/core';

const getApiBase = (): string => {
  // Explicit env override always wins
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  // Android native APK → always use the deployed Render backend
  if (Capacitor.isNativePlatform()) {
    return 'https://agrismart-3xj8.onrender.com/api';
  }
  // Capacitor-wrapped web view (file:// or capacitor:// protocol)
  if (
    typeof window !== 'undefined' && (
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      Boolean((window as any).Capacitor?.isNativePlatform?.())
    )
  ) {
    return 'https://agrismart-3xj8.onrender.com/api';
  }
  // Local development → use local backend (port 8000)
  if (
    typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  ) {
    return 'http://localhost:8000/api';
  }
  // Production web deployment → relative /api path
  return '/api';
};

export const API_BASE = getApiBase();


export interface SupabaseStatus {
  status: 'connected' | 'not_configured' | 'authentication_failed' | 'unreachable' | string;
  connected: boolean;
  provider?: string;
  url?: string;
  message?: string;
}

export interface CropDiseaseAssessment {
  id?: number;
  crop: string;
  image_path: string | null;
  saved?: boolean;
  assessment: {
    disease_present: boolean | null;
    crop_match: boolean | null;
    confidence: 'low' | 'medium' | 'high';
    disease_name: string;
    summary: string;
    pesticide_recommendations: { active_ingredient: string; target: string; label_precaution: string }[];
    safety_note: string;
  };
}

export interface ProduceListing {
  id: string;
  seller_name: string;
  seller_phone: string;
  crop_name: string;
  quantity_kg: number;
  price_per_kg: number;
  location: string;
  harvest_date?: string | null;
  quality_grade: string;
  details: string;
  status: string;
  created_at: string;
}

export interface Farm {
  id: number;
  user_id: number;
  farm_name: string;
  acreage: number;
  latitude: number;
  longitude: number;
  pincode: string;
  village: string;
  mandal?: string;
  district: string;
  state: string;
  survey_number?: string;
  soil_ph?: number | null;
  soil_ph_updated_at?: string;
  soil_type: string;
  water_availability: string;
  recent_rainfall: string;
  current_season: string;
  previous_crops: string;
  recent_fertilizers: string;
  irrigation_method: string;
  current_crops: string;
}

export interface WeatherForecastDay {
  day: string;
  date: string;
  max_temp: number;
  min_temp: number;
  rain_chance: number;
  condition: string;
  icon: string;
}

export interface WeatherData {
  farm_id?: number;
  farm_name?: string;
  village: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  updated_at: string;
  current_temp: number;
  feels_like: number;
  condition: string;
  rain_chance: number;
  max_temp: number;
  min_temp: number;
  wind_speed: number;
  humidity: number;
  forecast: WeatherForecastDay[];
  insights: { title: string; message: string; type: string; icon: string }[];
  audio_summary: string;
}

export interface SoilData {
  farm_id: number;
  farm_name: string;
  village: string;
  district: string;
  has_ph: boolean;
  soil_ph?: number | null;
  ph?: number;
  ph_category?: string;
  ph_status?: string;
  last_updated?: string;
  farm_factors?: {
    soil_type: string;
    water_availability: string;
    recent_rainfall: string;
    season: string;
    past_crops: string;
    recent_fertilizers: string;
  };
  guidance?: { title: string; message: string; action: string }[];
  recommended_crops?: { id: string; name: string; suitability: string; reason: string; preferred_ph: string; water_need: string; icon: string; color: string }[];
}

export const api = {
  // Farms
  async getFarms(): Promise<Farm[]> {
    const res = await fetch(`${API_BASE}/farms`);
    if (!res.ok) throw new Error("Failed to fetch farms");
    return res.json();
  },

  async createFarm(data: Partial<Farm>): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create farm");
    return res.json();
  },

  async updateFarm(id: number, data: Partial<Farm>): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update farm");
    return res.json();
  },

  async deleteFarm(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/farms/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete farm");
  },

  // Weather
  async getWeather(farmId: number): Promise<WeatherData> {
    const res = await fetch(`${API_BASE}/farms/${farmId}/weather`);
    if (!res.ok) throw new Error("Failed to fetch weather");
    return res.json();
  },

  // Soil
  async getSoil(farmId: number): Promise<SoilData> {
    const res = await fetch(`${API_BASE}/farms/${farmId}/soil`);
    if (!res.ok) throw new Error("Failed to fetch soil data");
    return res.json();
  },

  async updateSoilPh(farmId: number, ph: number): Promise<SoilData> {
    const res = await fetch(`${API_BASE}/farms/${farmId}/soil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soil_ph: ph })
    });
    if (!res.ok) throw new Error("Failed to update soil pH");
    return res.json();
  },

  // AI Ask
  async askAI(question: string, farmId?: number, language: string = 'en') {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, farm_id: farmId, language })
    });
    if (!res.ok) throw new Error("Failed to query AI");
    return res.json();
  },

  async transcribeAudio(audio: Blob, language: string = 'en'): Promise<{ transcript: string }> {
    const rawType = (audio.type || 'audio/webm').split(';', 1)[0].trim().toLowerCase();
    const mimeType = rawType && rawType.startsWith('audio/') ? rawType : 'audio/webm';
    try {
      const res = await fetch(`${API_BASE}/ai/transcribe?language=${encodeURIComponent(language)}`, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: audio,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { transcript: data.transcript || '' };
      }
      return await res.json();
    } catch {
      return { transcript: '' };
    }
  },

  // Location
  async lookupPincode(pincode: string) {
    const res = await fetch(`${API_BASE}/location/pincode/${pincode}`);
    if (!res.ok) throw new Error("Invalid PIN code");
    return res.json();
  },

  async reverseGeocode(lat: number, lon: number) {
    const res = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Reverse geocode failed");
    return res.json();
  },

  // Alerts & Saved
  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async getDynamicClimateAlerts(farmId?: number, period: string = 'today', language: string = 'en') {
    const targetFarmId = farmId || 1;
    const params = new URLSearchParams({ period, language });
    const res = await fetch(`${API_BASE}/alerts/farm/${targetFarmId}?${params}`);
    if (!res.ok) throw new Error("Failed to fetch climate risk alerts");
    return res.json();
  },

  async getSaved() {
    const res = await fetch(`${API_BASE}/saved`);
    return res.json();
  },

  async saveItem(data: any) {
    const res = await fetch(`${API_BASE}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteSaved(id: number) {
    await fetch(`${API_BASE}/saved/${id}`, { method: 'DELETE' });
  },

  // Insights
  async getFarmInsights(farmId: number, language: string = 'en') {
    const res = await fetch(`${API_BASE}/farms/${farmId}/insights?language=${encodeURIComponent(language)}`);
    if (!res.ok) throw new Error("Failed to fetch dynamic farm insights");
    return res.json();
  },

  // Irrigation
  async getIrrigationPlan(
    farmId: number,
    crop: string,
    waterSource: string,
    growthStage: string = "Vegetative Stage",
    language: string = "en",
    fieldUpdate?: {
      soil_moisture: "dry" | "normal" | "wet" | "unknown";
      pest_observed: boolean;
      pest_description?: string;
      pesticide_status: "not_used" | "used" | "not_sure";
      pesticide_name?: string;
      last_application_date?: string;
      notes: string;
    },
    cropDurationDays?: number,
  ) {
    const res = await fetch(`${API_BASE}/irrigation/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farm_id: farmId,
        crop,
        water_source: waterSource,
        growth_stage: growthStage,
        crop_duration_days: cropDurationDays,
        language: ["en", "te", "hi"].includes(language) ? language : "en",
        field_update: fieldUpdate,
      })
    });
    if (!res.ok) throw new Error("Failed to fetch irrigation plan");
    return res.json();
  },

  async getSupabaseStatus(): Promise<SupabaseStatus> {
    const res = await fetch(`${API_BASE}/supabase/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch Supabase status");
    return res.json();
  },

  async assessCropDisease(input: { image: File; crop: string; symptoms: string; language: string; farmId?: number }): Promise<CropDiseaseAssessment> {
    const body = new FormData();
    body.append('image', input.image);
    body.append('crop', input.crop);
    body.append('symptoms', input.symptoms);
    body.append('language', ['en', 'te', 'hi'].includes(input.language) ? input.language : 'en');
    if (input.farmId) body.append('farm_id', String(input.farmId));
    const res = await fetch(`${API_BASE}/farmer-tools/disease-assessment`, { method: 'POST', body });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not assess the crop image. Please try again.');
    }
    return res.json();
  },

  async getProduceListings(crop?: string): Promise<ProduceListing[]> {
    const query = crop?.trim() ? `?crop=${encodeURIComponent(crop.trim())}` : '';
    const res = await fetch(`${API_BASE}/farmer-tools/marketplace/listings${query}`, { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not load produce listings.');
    }
    return res.json();
  },

  async createProduceListing(input: Omit<ProduceListing, 'id' | 'status' | 'created_at'> & { farm_id?: number }): Promise<ProduceListing> {
    const res = await fetch(`${API_BASE}/farmer-tools/marketplace/listings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not publish your crop listing.');
    }
    return res.json();
  },

  async requestProducePurchase(listingId: string, buyer: { buyer_name: string; buyer_phone: string; quantity_kg: number }) {
    const res = await fetch(`${API_BASE}/farmer-tools/marketplace/listings/${encodeURIComponent(listingId)}/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buyer),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not submit your purchase request.');
    }
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/profile`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  async updateProfile(data: { name?: string; preferred_language?: string }) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  }
};


