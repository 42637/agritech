# AgriSmart AI - Supabase Database Setup & Operations Guide

This directory contains the database migration scripts, queries, and structure needed to connect AgriSmart AI with **Supabase PostgreSQL**.

---

## 📁 Supabase Folder Structure

```
supabase/
├── migrations/
│   └── 20261009_init_schema.sql  <-- Complete PostgreSQL DDL Schema
├── queries.sql                   <-- Pre-written CRUD & Caching Queries
└── README.md                     <-- Setup Instructions
```

---

## 🚀 How to Apply Schema in Supabase

1. Open your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project (or create a new project).
3. Navigate to **SQL Editor** on the left menu.
4. Open [supabase/migrations/20261009_init_schema.sql](migrations/20261009_init_schema.sql) and paste into the SQL Editor.
5. Click **Run** to generate all 7 tables (`users`, `farms`, `weather_cache`, `soil_data`, `ai_conversations`, `weather_alerts`, `saved_items`).

---

## 🔑 Environment Configuration (`.env`)

Add your project credentials in `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
```

---

## 📊 Tables Overview

| Table Name | Description |
|---|---|
| `users` | Farmer profiles and language preferences |
| `farms` | Farm parcels with acreage, coordinates, pincode, soil pH |
| `weather_cache` | Cached Open-Meteo 7-day forecast & weather metrics per farm |
| `soil_data` | Soil testing records and pH history |
| `ai_conversations` | Logged Google Gemini AI Q&A history |
| `weather_alerts` | Dynamic weather advisory alerts |
| `saved_items` | Farmer bookmarked guidance & advisories |

## Farmer tools (crop health and direct market)

Apply `migrations/20261010_farmer_tools.sql` in the Supabase Dashboard **SQL Editor** before using the two new home-screen features. It creates the private crop-photo bucket, crop assessment records, farmer produce listings, and buyer requests. It also installs an atomic stock-reservation function for direct orders. The migration enables RLS and grants data access only to the backend `service_role`; it does not expose the secret key or records to browser clients.

Crop photos are uploaded to the private `crop-disease-images` bucket after Gemini returns an assessment. A buyer request reserves the requested quantity and stores the buyer and farmer contact details so both parties can arrange payment and delivery directly; the app does not process payments.
