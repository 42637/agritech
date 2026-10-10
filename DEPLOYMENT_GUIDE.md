# AgriSmart AI — Production Deployment & APK Build Guide

This guide provides complete instructions for deploying the **AgriSmart AI** backend to Render and building the Android APK for mobile devices.

---

## 1. System Architecture

* **Backend:** FastAPI (Python 3.13) + Uvicorn + SQLAlchemy.
* **Frontend:** React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4.
* **Mobile Runtime:** Capacitor 8.5 Native Android Wrapper (`com.agrismart.app`).
* **Hosting Target:** Render Web Service (Backend) & Android Mobile Devices (APK).

---

## 2. Environment Variables Reference

### Backend (`backend/.env` & Render Dashboard)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `ENVIRONMENT` | Application mode | `production` |
| `GEMINI_API_KEY` | Google Gemini AI Key | `AQ...` |
| `GEMINI_MODEL` | AI Model Version | `gemini-3.8-flash` |
| `SARVAM_API_KEY` | Sarvam AI STT Key | `sk_weu...` |
| `DATABASE_URL` | Database Connection String | `sqlite:///./agrismart.db` or `postgresql://user:pass@host:5432/dbname` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | Supabase Anon Key | `sb_publishable_...` |
| `FRONTEND_ORIGIN` | Allowed CORS Origins | `*` or `https://your-app.onrender.com` |

---

## 3. Step-by-Step Render Deployment

1. **Push Repository to GitHub / GitLab:**
   ```powershell
   git add .
   git commit -m "Prepare AgriSmart AI for Render deployment"
   git push origin main
   ```

2. **Connect to Render Blueprint:**
   - Log in to [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** → **Blueprint**.
   - Connect your repository (`agrismart-1`).
   - Render will automatically load `render.yaml`.

3. **Configure Environment Variables on Render:**
   - Add the secret keys listed in Section 2 (`GEMINI_API_KEY`, `SARVAM_API_KEY`, `SUPABASE_KEY`, `DATABASE_URL`).

4. **Verify Deployment:**
   - Once deployed, visit: `https://<your-render-app>.onrender.com/api/health`
   - Ensure the JSON response indicates `"status": "healthy"`.

---

## 4. Building the Android APK

### Step 1: Set Production Backend URL
In `frontend/.env.production` (or `.env`), set your live Render backend URL:
```env
VITE_API_URL=https://<your-render-app>.onrender.com
```

### Step 2: Build Web Assets & Sync Capacitor
From the project root:
```powershell
cd f:\agrismart-1\frontend
npm run build
npx cap sync android
```

### Step 3: Compile Android Debug APK
```powershell
cd f:\agrismart-1\frontend\android
.\gradlew.bat assembleDebug
```
The output APK will be generated at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Mobile Device Testing & Installation

1. Connect Android smartphone to PC via USB with **USB Debugging** enabled.
2. Run ADB install:
   ```powershell
   adb install f:\agrismart-1\frontend\android\app\build\outputs\apk\debug\app-debug.apk
   ```
3. Alternatively, copy `app-debug.apk` directly to mobile storage and tap to install.
4. Launch **AgriSmart AI** on phone and test:
   - Weather forecasts
   - Soil pH guidance
   - Voice Ask Agri advisor (STT)
   - Crop disease camera assessment
   - Produce marketplace
