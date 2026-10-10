-- =====================================================================
-- AgriSmart AI - Essential Supabase SQL Queries Cheat-Sheet
-- Copy & Run these in Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. Insert Initial Farmer User
INSERT INTO public.users (name, phone, preferred_language, verified)
VALUES ('Ramesh Kumar', '+919876543210', 'en', true)
ON CONFLICT (phone) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- 2. Insert Farm Parcels for Farmer
INSERT INTO public.farms (user_id, farm_name, acreage, latitude, longitude, pincode, village, mandal, district, state, soil_ph, soil_type, water_availability, current_crops)
VALUES
(1, 'Bhimavaram Farm', 2.50, 16.544900, 81.521200, '534201', 'Bhimavaram', 'Bhimavaram', 'West Godavari', 'Andhra Pradesh', 6.5, 'Loamy', 'Moderate', 'Paddy'),
(1, 'Tanuku Farm', 1.75, 16.758800, 81.696100, '534211', 'Tanuku', 'Tanuku', 'West Godavari', 'Andhra Pradesh', 6.8, 'Clay', 'High', 'Paddy'),
(1, 'Narsapuram Farm', 3.00, 16.438900, 81.688300, '534275', 'Narsapuram', 'Narsapuram', 'West Godavari', 'Andhra Pradesh', 7.1, 'Alluvial', 'High', 'Sugarcane');

-- 3. Query All Farms for User
SELECT id, farm_name, village, district, state, latitude, longitude, soil_ph, current_crops
FROM public.farms
WHERE user_id = 1;

-- 4. Store Live Open-Meteo Weather Cache for Farm
INSERT INTO public.weather_cache (farm_id, village, district, state, latitude, longitude, current_temp, feels_like, condition, rain_chance, max_temp, min_temp, wind_speed, humidity, forecast_json, insights_json)
VALUES (
  1, 'Bhimavaram', 'West Godavari', 'Andhra Pradesh', 16.5449, 81.5212,
  27, 33, 'Clear Sky', 25, 33, 26, 5, 68,
  '[
    {"day": "Fri", "date": "09 Oct", "max_temp": 33, "min_temp": 26, "rain_chance": 25, "condition": "Sunny", "icon": "sun"},
    {"day": "Sat", "date": "10 Oct", "max_temp": 33, "min_temp": 25, "rain_chance": 16, "condition": "Sunny", "icon": "sun"},
    {"day": "Sun", "date": "11 Oct", "max_temp": 32, "min_temp": 25, "rain_chance": 49, "condition": "Rainy", "icon": "rain"}
  ]'::jsonb,
  '[
    {"title": "Rain expected on Sun", "message": "49% chance of rain on Sun.", "type": "warning", "icon": "rain"}
  ]'::jsonb
);

-- 5. Query Latest Weather Cache by Farm ID
SELECT * FROM public.weather_cache
WHERE farm_id = 1
ORDER BY updated_at DESC
LIMIT 1;

-- 6. Insert AI Chat Conversation
INSERT INTO public.ai_conversations (user_id, farm_id, question, answer, language)
VALUES (
  1, 1,
  'Best fertilizer dose for Paddy in Kharif season?',
  'Apply NPK in 120:60:40 ratio with split urea doses at basal, tillering, and panicle initiation.',
  'en'
);

-- 7. Query AI Conversation History
SELECT question, answer, created_at
FROM public.ai_conversations
WHERE user_id = 1
ORDER BY created_at DESC;
