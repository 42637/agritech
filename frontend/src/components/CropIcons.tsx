import React from 'react';

// 1. Paddy (Rice Sheaf / Golden Grains)
export const PaddyCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Curved Stem */}
      <path d="M20 42 C22 30 24 20 28 10" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Left Leaf */}
      <path d="M21 34 C12 30 10 20 18 18 C22 22 22 28 21 34 Z" fill="#22C55E" />
      {/* Golden Rice Grains Head */}
      <g fill="#F59E0B">
        <circle cx="28" cy="10" r="3.5" />
        <circle cx="25" cy="15" r="3" />
        <circle cx="31" cy="16" r="3" />
        <circle cx="23" cy="21" r="3" />
        <circle cx="30" cy="22" r="3" />
        <circle cx="22" cy="27" r="2.8" />
        <circle cx="28" cy="28" r="2.8" />
      </g>
    </svg>
  </div>
);

// 2. Maize (Corn Cob)
export const MaizeCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FEFCE8] border border-yellow-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Green Husk Leaves */}
      <path d="M12 40 C14 26 22 20 18 12 C24 16 26 26 22 40 Z" fill="#15803D" />
      <path d="M36 40 C34 26 26 20 30 12 C24 16 22 26 26 40 Z" fill="#16A34A" />
      {/* Yellow Corn Cob */}
      <rect x="19" y="10" width="10" height="24" rx="5" fill="#EAB308" />
      {/* Kernel Grid Texture */}
      <g fill="#FACC15">
        <circle cx="22" cy="14" r="1.5" />
        <circle cx="26" cy="14" r="1.5" />
        <circle cx="22" cy="18" r="1.5" />
        <circle cx="26" cy="18" r="1.5" />
        <circle cx="22" cy="22" r="1.5" />
        <circle cx="26" cy="22" r="1.5" />
        <circle cx="22" cy="26" r="1.5" />
        <circle cx="26" cy="26" r="1.5" />
        <circle cx="24" cy="30" r="1.5" />
      </g>
    </svg>
  </div>
);

// 3. Groundnut (Peanut Pod)
export const GroundnutCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-orange-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Peanut Shell Body */}
      <path d="M16 34 C12 28 12 20 18 14 C24 10 28 16 32 18 C38 20 40 28 34 34 C28 40 22 36 16 34 Z" fill="#D97706" />
      <path d="M18 32 C14 27 14 21 19 16 C24 12 27 17 31 19 C36 21 38 27 33 32 C28 37 23 34 18 32 Z" fill="#F59E0B" />
      {/* Shell Waist Dent */}
      <path d="M22 20 C24 24 22 28 26 30" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 4. Chilli (Red Chilli Pepper)
export const ChilliCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-red-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Green Stem */}
      <path d="M18 8 Q24 6 26 12" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Green Stem Cap */}
      <path d="M21 12 C24 10 28 10 30 14 C26 16 23 15 21 12 Z" fill="#22C55E" />
      {/* Curved Red Pepper Body */}
      <path d="M22 14 Q32 18 28 32 Q25 40 16 42 Q20 34 22 26 Z" fill="#EF4444" />
      <path d="M23 15 Q30 19 27 31 Q24 38 17 40 Q21 33 23 23 Z" fill="#DC2626" />
      {/* Highlight */}
      <path d="M25 18 Q27 24 25 30" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  </div>
);

// 5. Cotton (3D Cotton Boll)
export const CottonCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Brown Sepal Bracts */}
      <path d="M14 36 L24 42 L34 36 L28 28 L20 28 Z" fill="#78350F" />
      <path d="M24 42 L24 46" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
      {/* Fluffy White Cotton Lobes */}
      <circle cx="18" cy="22" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="30" cy="22" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="24" cy="15" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="8" fill="#F8FAFC" />
    </svg>
  </div>
);

// 6. Turmeric (Orange Rhizome Root)
export const TurmericCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Turmeric Rhizome Body */}
      <path d="M14 26 C12 18 20 12 28 14 C36 16 38 26 30 34 C24 38 16 34 14 26 Z" fill="#D97706" />
      <path d="M16 28 C20 30 26 32 30 24 C34 16 26 14 20 20 Z" fill="#F59E0B" />
      {/* Root Knots */}
      <ellipse cx="16" cy="32" rx="4" ry="7" fill="#B45309" transform="rotate(-30 16 32)" />
      <ellipse cx="32" cy="18" rx="4" ry="6" fill="#B45309" transform="rotate(20 32 18)" />
      {/* Green Leaf Tip */}
      <path d="M24 14 Q28 6 36 8" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 7. Sugarcane (Tall Stalks)
export const SugarcaneCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-green-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Main Stalk */}
      <rect x="20" y="8" width="8" height="34" rx="3" fill="#16A34A" />
      {/* Stalk Nodes / Rings */}
      <line x1="19" y1="16" x2="29" y2="16" stroke="#14532D" strokeWidth="2.5" />
      <line x1="19" y1="26" x2="29" y2="26" stroke="#14532D" strokeWidth="2.5" />
      <line x1="19" y1="36" x2="29" y2="36" stroke="#14532D" strokeWidth="2.5" />
      {/* Top Leaves */}
      <path d="M24 10 C16 6 8 10 10 18" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M24 10 C32 6 40 10 38 18" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 8. Tomato (Glossy Red Tomato)
export const TomatoCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-red-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Red Tomato Body */}
      <circle cx="24" cy="27" r="14" fill="#EF4444" />
      <circle cx="24" cy="27" r="14" fill="#DC2626" opacity="0.4" />
      {/* Glossy Highlight */}
      <ellipse cx="19" cy="21" rx="4" ry="2" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 19 21)" />
      {/* Green Star Leaf Cap */}
      <g fill="#16A34A">
        <path d="M24 15 L22 10 L24 13 L26 10 Z" />
        <path d="M24 15 L17 14 L21 16 Z" />
        <path d="M24 15 L31 14 L27 16 Z" />
        <path d="M24 15 L19 18 L22 17 Z" />
        <path d="M24 15 L29 18 L26 17 Z" />
      </g>
    </svg>
  </div>
);

// 9. Onion (Purple Onion Bulb)
export const OnionCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] border border-purple-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Green Sprout Top */}
      <path d="M24 16 L24 6 M24 14 L20 8 M24 14 L28 8" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Purple Bulb Body */}
      <path d="M24 14 C14 14 10 24 14 34 C18 42 30 42 34 34 C38 24 34 14 24 14 Z" fill="#9333EA" />
      <path d="M24 16 C16 16 13 24 16 32 C20 39 28 39 32 32 C35 24 32 16 24 16 Z" fill="#A855F7" opacity="0.6" />
      {/* Bottom Root Tufts */}
      <path d="M21 40 L21 44 M24 40 L24 45 M27 40 L27 44" stroke="#D8B4FE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// 10. Red Gram (Arhar Pulse Pods)
export const RedGramCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-rose-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Red Pod */}
      <path d="M12 36 Q20 18 36 12 Q28 30 12 36 Z" fill="#E11D48" />
      <path d="M14 34 Q21 19 34 14 Q27 29 14 34 Z" fill="#F43F5E" />
      {/* Seeds inside */}
      <circle cx="20" cy="28" r="3" fill="#FFE4E6" />
      <circle cx="26" cy="22" r="3" fill="#FFE4E6" />
      {/* Stem */}
      <path d="M36 12 Q40 8 42 10" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 11. Black Gram (Urad Pods)
export const BlackGramCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Black Pod Body */}
      <path d="M10 38 Q22 20 38 10 Q28 32 10 38 Z" fill="#1E293B" />
      <path d="M12 36 Q23 21 36 12 Q27 31 12 36 Z" fill="#334155" />
      {/* Seed Bulges */}
      <circle cx="18" cy="30" r="2.8" fill="#94A3B8" />
      <circle cx="25" cy="23" r="2.8" fill="#94A3B8" />
      <circle cx="31" cy="17" r="2.8" fill="#94A3B8" />
      {/* Green Stem */}
      <path d="M38 10 Q42 6 44 8" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 12. Green Gram (Moong Legume Pods)
export const GreenGramCropIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-emerald-200/80 flex items-center justify-center p-1.5 shadow-2xs">
    <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-xs">
      {/* Green Legume Pod */}
      <path d="M10 38 Q22 18 38 10 Q28 32 10 38 Z" fill="#059669" />
      <path d="M12 36 Q23 19 36 12 Q27 30 12 36 Z" fill="#10B981" />
      {/* Mung Bean Seeds inside */}
      <circle cx="18" cy="30" r="3" fill="#D1FAE5" />
      <circle cx="25" cy="23" r="3" fill="#D1FAE5" />
      <circle cx="31" cy="17" r="3" fill="#D1FAE5" />
      {/* Green Stem */}
      <path d="M38 10 Q42 6 44 8" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// Crop Icon Selector Component
export const CropIconMapper: React.FC<{ cropId: string }> = ({ cropId }) => {
  switch (cropId) {
    case 'Paddy':
      return <PaddyCropIcon />;
    case 'Maize':
      return <MaizeCropIcon />;
    case 'Groundnut':
      return <GroundnutCropIcon />;
    case 'Chilli':
      return <ChilliCropIcon />;
    case 'Cotton':
      return <CottonCropIcon />;
    case 'Turmeric':
      return <TurmericCropIcon />;
    case 'Sugarcane':
      return <SugarcaneCropIcon />;
    case 'Tomato':
      return <TomatoCropIcon />;
    case 'Onion':
      return <OnionCropIcon />;
    case 'Red Gram':
      return <RedGramCropIcon />;
    case 'Black Gram':
      return <BlackGramCropIcon />;
    case 'Green Gram':
      return <GreenGramCropIcon />;
    default:
      return <PaddyCropIcon />;
  }
};
