import React from 'react';

// Crop-specific illustrations; keeping each crop on its own asset prevents
// unrelated images from silently standing in for crops that have no photo.
export const CROP_IMAGES: Record<string, string> = {
  Paddy: '/assets/crops/crop_paddy.svg',
  Maize: '/assets/crops/crop_maize.svg',
  Chilli: '/assets/crops/crop_chilli.svg',
  Groundnut: '/assets/crops/crop_groundnut.svg',
  Turmeric: '/assets/crops/crop_turmeric.svg',
  Cotton: '/assets/crops/crop_cotton.svg',
  'Green Gram': '/assets/crops/crop_greengram.svg',
  Sesame: '/assets/crops/crop_sesame.svg',
  Sugarcane: '/assets/crops/crop_sugarcane.svg',
  Tomato: '/assets/crops/crop_tomato.svg',
  Onion: '/assets/crops/crop_onion.svg',
  'Red Gram': '/assets/crops/crop_redgram.svg',
  'Black Gram': '/assets/crops/crop_blackgram.svg',
};

// Crop thumbnail with a neutral fallback for any crop that has no mapped art.
export const CropImageThumb: React.FC<{ cropId: string; size?: 'sm' | 'md' | 'lg' }> = ({
  cropId,
  size = 'md'
}) => {
  const imgSrc = CROP_IMAGES[cropId];
  
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-2xl'
  }[size];

  return (
    <div className={`${sizeClasses} overflow-hidden shadow-2xs border border-gray-200/80 bg-gray-50 shrink-0 relative`}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={`${cropId} illustration`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transition-transform hover:scale-105"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-600" aria-label={cropId}>
          {cropId.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// 1. Paddy (Rice Sheaf / Golden Grains)
export const PaddyCropIcon: React.FC = () => <CropImageThumb cropId="Paddy" size="md" />;
export const MaizeCropIcon: React.FC = () => <CropImageThumb cropId="Maize" size="md" />;
export const GroundnutCropIcon: React.FC = () => <CropImageThumb cropId="Groundnut" size="md" />;
export const ChilliCropIcon: React.FC = () => <CropImageThumb cropId="Chilli" size="md" />;
export const CottonCropIcon: React.FC = () => <CropImageThumb cropId="Cotton" size="md" />;
export const TurmericCropIcon: React.FC = () => <CropImageThumb cropId="Turmeric" size="md" />;
export const SugarcaneCropIcon: React.FC = () => <CropImageThumb cropId="Sugarcane" size="md" />;
export const TomatoCropIcon: React.FC = () => <CropImageThumb cropId="Tomato" size="md" />;
export const OnionCropIcon: React.FC = () => <CropImageThumb cropId="Onion" size="md" />;
export const RedGramCropIcon: React.FC = () => <CropImageThumb cropId="Red Gram" size="md" />;
export const BlackGramCropIcon: React.FC = () => <CropImageThumb cropId="Black Gram" size="md" />;
export const GreenGramCropIcon: React.FC = () => <CropImageThumb cropId="Green Gram" size="md" />;
export const SesameCropIcon: React.FC = () => <CropImageThumb cropId="Sesame" size="md" />;

// Crop Icon Selector Component
export const CropIconMapper: React.FC<{ cropId: string; size?: 'sm' | 'md' | 'lg' }> = ({
  cropId,
  size = 'md'
}) => {
  return <CropImageThumb cropId={cropId} size={size} />;
};
