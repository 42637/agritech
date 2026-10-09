const API_BASE = '/api';

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
  async getFarmInsights(farmId: number) {
    const res = await fetch(`${API_BASE}/farms/${farmId}/insights`);
    if (!res.ok) throw new Error("Failed to fetch dynamic farm insights");
    return res.json();
  },

  // Irrigation
  async getIrrigationPlan(farmId: number, crop: string, waterSource: string, growthStage: string = "Vegetative Stage") {
    const res = await fetch(`${API_BASE}/irrigation/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farm_id: farmId, crop, water_source: waterSource, growth_stage: growthStage })
    });
    if (!res.ok) throw new Error("Failed to fetch irrigation plan");
    return res.json();
  }
};
