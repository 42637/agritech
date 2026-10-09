import React from 'react';

// 1. Weather Updates 3D Sun & Cloud Icon
export const RefWeatherIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#E0F2FE] flex items-center justify-center p-1.5 shadow-xs relative">
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Sun rays & disk */}
      <circle cx="44" cy="22" r="11" fill="#FBBF24" />
      <path d="M44 6 L44 9 M44 35 L44 38 M28 22 L31 22 M57 22 L60 22 M33 11 L35 13 M53 31 L55 33 M33 33 L35 31 M53 13 L55 11" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Fluffy Blue Cloud */}
      <path d="M16 44 C12 44, 9 41, 9 37 C9 33.5, 11.5 30.5, 15 30 C16 24.5, 20.5 20, 26 20 C31 20, 35.5 23.5, 36.5 28.5 C39 27.5, 42 28.5, 43.5 31 C45.5 33.5, 45 37, 43 39.5 C42 41, 40 44, 36 44 Z" fill="#0EA5E9" />
      <path d="M18 42 C15 42, 12 39.5, 12 36 C12 33, 14 30.5, 17 30 C18 25.5, 21.5 22, 26 22 C30 22, 34 25, 35 29 C37 28, 39.5 29, 41 31 C42.5 33, 42 36, 40.5 38 Z" fill="#38BDF8" opacity="0.6" />
    </svg>
  </div>
);

// 2. Soil Intelligence Seedling Icon
export const RefSoilIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#FEF3C7]/80 flex items-center justify-center overflow-hidden p-1 shadow-xs">
    <img
      src="/assets/soil_seedling.jpg"
      alt="Soil Seedling"
      className="w-full h-full object-cover rounded-xl"
    />
  </div>
);

// 3. Climate Risk Alerts Red Warning Triangle Icon
export const RefAlertIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#FFEEEF] flex items-center justify-center p-2 shadow-xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Red Glossy Triangle */}
      <path
        d="M24 6 L44 40 C45 42 44 44 42 44 L6 44 C4 44 3 42 4 40 L24 6 Z"
        fill="#EF4444"
      />
      {/* Inner highlight */}
      <path
        d="M24 9 L41 39 L7 39 Z"
        fill="#DC2626"
      />
      {/* Exclamation mark */}
      <rect x="22" y="18" width="4" height="12" rx="2" fill="#FFFFFF" />
      <circle cx="24" cy="34" r="2.5" fill="#FFFFFF" />
    </svg>
  </div>
);

// 4. Smart Irrigation Cyan Drop Icon
export const RefIrrigationIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#E0F7FA] flex items-center justify-center p-2 shadow-xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      <path
        d="M24 6 C24 6 10 24 10 32 C10 39.7 16.3 46 24 46 C31.7 46 38 39.7 38 32 C38 24 24 6 24 6 Z"
        fill="#0284C7"
      />
      <path
        d="M24 9 C24 9 13 25 13 32 C13 38 18 43 24 43 Z"
        fill="#38BDF8"
        opacity="0.8"
      />
      <ellipse cx="19" cy="26" rx="2" ry="5" fill="#FFFFFF" opacity="0.6" transform="rotate(-20 19 26)" />
    </svg>
  </div>
);

// 5. Crop Recommendation Purple Sprout Icon
export const RefCropIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#F3E5F5] flex items-center justify-center p-1.5 shadow-xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9">
      {/* Soil base */}
      <ellipse cx="24" cy="38" rx="14" ry="5" fill="#78350F" />
      {/* Stem */}
      <path d="M24 38 C24 28, 23 20, 21 12" stroke="#15803D" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Left Leaf */}
      <path d="M22 22 C12 18, 8 8, 16 6 C22 6, 23 16, 22 22 Z" fill="#22C55E" />
      {/* Right Leaf */}
      <path d="M22 18 C32 14, 36 4, 28 2 C22 2, 21 12, 22 18 Z" fill="#166534" />
    </svg>
  </div>
);

// 6. Farm Insights 3D Bar Graph Icon
export const RefInsightsIcon: React.FC = () => (
  <div className="w-13 h-13 rounded-2xl bg-[#FFF8E1] flex items-center justify-center p-2 shadow-xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9">
      {/* Short Green Bar */}
      <rect x="10" y="26" width="7" height="14" rx="3" fill="#22C55E" />
      {/* Medium Green Bar */}
      <rect x="20" y="18" width="7" height="22" rx="3" fill="#166534" />
      {/* Tall Yellow/Orange Bar */}
      <rect x="30" y="10" width="7" height="30" rx="3" fill="#F59E0B" />
    </svg>
  </div>
);

// Arrow buttons matching exact colored background circles
export const RefArrowBtn: React.FC<{ colorBg: string; colorIcon: string }> = ({ colorBg, colorIcon }) => (
  <div className={`w-7 h-7 rounded-full ${colorBg} ${colorIcon} flex items-center justify-center shadow-2xs`}>
    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current stroke-[2.5]" fill="none">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);
