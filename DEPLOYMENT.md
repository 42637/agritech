# AgriSmart AI — Mobile App & Render Backend Deployment Guide

This guide provides end-to-end instructions for deploying the **AgriSmart AI** FastAPI backend to **Render** and building the **Android APK** for mobile devices using Capacitor.

---

## 1. System Architecture Overview

* **Backend Framework:** FastAPI (Python 3.11/3.13) with SQLAlchemy, Uvicorn, Supabase, and Google Gemini AI.
* **Frontend Framework:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4.
* **Mobile Runtime:** Capacitor 7 Android Native Wrapper (`com.agrismart.app`).
* **Database:** SQLite (local development) / PostgreSQL (Render Postgres / Supabase in production).
* **Hosting Target:** Render Web Service (Backend) & Android Mobile Devices (APK).

---

## 2. Environment Variables Configuration

### Backend Environment Variables (`backend/.env` & Render Dashboard)

| Variable | Description | Example / Value |
|---|---|---|
| `ENVIRONMENT` | Application mode | `production` |
| `DATABASE_URL` | SQLite path or PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AQ...` |
| `GEMINI_MODEL` | AI model version | `gemini-3.8-flash` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | Supabase anon publishable key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `sb_secret_...` |
| `FRONTEND_ORIGIN` | Allowed CORS origins (`*` or domain) | `*` |
| `PORT` | Auto-injected by Render | `10000` |

### Frontend Environment Variables (`frontend/.env` or `.env.production`)

```env
VITE_API_URL=https://agrismart-backend.onrender.com
```

---

## 3. Deploying the Backend to Render

1. **Connect Repository to Render:**
   - Log in to [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** → **Blueprint** (or **Web Service**).
   - Select your GitHub/GitLab repository (`agrismart-1`).

2. **Using Render Blueprint (`render.yaml`):**
   - Render automatically detects `render.yaml` in the root of the repository.
   - Click **Apply** to provision the web service.

3. **Manual Web Service Configuration (if creating manually):**
   - **Environment:** `Python`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`

4. **Verify Backend Deployment:**
   Once deployed, visit your Render URL:
   - Root Status: `https://<your-render-app>.onrender.com/`
   - Health Check: `https://<your-render-app>.onrender.com/api/health`
   - Interactive Docs: `https://<your-render-app>.onrender.com/docs`

---

## 4. Building the Android APK

### Prerequisites:
- JDK 17 or JDK 21/24 installed.
- Android SDK installed (`C:\Users\LENOVO\AppData\Local\Android\Sdk` or `$ANDROID_HOME`).
- Node.js & npm installed.

### Step 1: Configure Backend Production URL in Frontend
Create `frontend/.env.production` or set environment variable:
```env
VITE_API_URL=https://<your-render-app>.onrender.com
```

### Step 2: Build Web Assets & Sync to Capacitor
In your terminal, run:
```powershell
cd f:\agrismart-1\frontend
npm run build
npx cap sync android
```

### Step 3: Build Debug APK
Run Gradle build:
```powershell
cd f:\agrismart-1\frontend\android
.\gradlew assembleDebug
```
The generated APK artifact will be created at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Build Signed Release APK (for Distribution)
1. Generate a keystore (if not already created):
   ```powershell
   keytool -genkey -v -keystore release.keystore -alias agrismart -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Run release build:
   ```powershell
   cd f:\agrismart-1\frontend\android
   .\gradlew assembleRelease
   ```
3. Sign the APK using `apksigner` or configure signing in `app/build.gradle`.

---

## 5. Installing and Testing on Physical Mobile Device

1. **Install APK via ADB:**
   Connect your Android phone via USB with USB Debugging enabled, then run:
   ```powershell
   adb install f:\agrismart-1\frontend\android\app\build\outputs\apk\debug\app-debug.apk
   ```
2. **Manual Installation:**
   Transfer `app-debug.apk` to your mobile device, open file manager, and tap to install.
3. **Verify Functionality:**
   - Launch **AgriSmart AI** on mobile device (using Wi-Fi or Mobile Data).
   - Test key features: Weather forecast, Soil PH analysis, AI Agri Advisor, Disease Assessment camera upload, and Produce Marketplace.

---

## 6. Troubleshooting Common Issues

* **Android network error / CORS failure:**
  Ensure `VITE_API_URL` is set to your Render HTTPS URL (e.g. `https://agrismart-backend.onrender.com`) before running `npm run build` and `npx cap sync android`.
* **Render cold starts:**
  Free Render instances sleep after 15 minutes of inactivity. First request may take 30-50 seconds to respond on cold boot.
* **Database Connection Errors:**
  If using PostgreSQL on Supabase or Render, verify `DATABASE_URL` starts with `postgresql://` (handled automatically in `database.py`).
