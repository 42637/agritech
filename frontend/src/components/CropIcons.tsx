import React from 'react';

// Real Crop Image Mapping
export const CROP_IMAGES: Record<string, string> = {
  Paddy: '/assets/crop_paddy.jpg',
  Maize: '/assets/crop_maize.jpg',
  Chilli: '/assets/crop_chilli.jpg',
  Groundnut: '/assets/crop_groundnut.jpg',
  Turmeric: '/assets/crop_turmeric.jpg',
  Cotton: '/assets/crop_cotton.jpg',
  'Green Gram': '/assets/crop_greengram.jpg',
  Sesame: '/assets/crop_sesame.jpg',
  Sugarcane: '/assets/crop_paddy.jpg',
  Tomato: '/assets/crop_chilli.jpg',
  Onion: '/assets/crop_turmeric.jpg',
  'Red Gram': '/assets/crop_groundnut.jpg',
  'Black Gram': '/assets/crop_greengram.jpg',
};

// 1. Real Crop Image Component with styled container & fallback
export const CropImageThumb: React.FC<{ cropId: string; size?: 'sm' | 'md' | 'lg' }> = ({
  cropId,
  size = 'md'
}) => {
  const imgSrc = CROP_IMAGES[cropId] || '/assets/crop_paddy.jpg';
  
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-2xl'
  }[size];

  return (
    <div className={`${sizeClasses} overflow-hidden shadow-2xs border border-gray-200/80 bg-gray-50 shrink-0 relative`}>
      <img
        src={imgSrc}
        alt={cropId}
        className="w-full h-full object-cover object-center transition-transform hover:scale-105"
      />
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
