import type { ImageSourcePropType } from 'react-native';

export const BUNDLED_PET_IMAGES: Record<string, ImageSourcePropType> = {
  'LilMama.jpeg': require('../../assets/images/pets/LilMama.jpeg'),
  'LilMama2.jpeg': require('../../assets/images/pets/LilMama2.jpeg'),
  'Louie.jpeg': require('../../assets/images/pets/Louie.jpeg'),
  'Louie2.jpeg': require('../../assets/images/pets/Louie2.jpeg'),
  'Mia.jpeg': require('../../assets/images/pets/Mia.jpeg'),
  'Mrs Frizzle.jpeg': require('../../assets/images/pets/Mrs Frizzle.jpeg'),
  'Nala.jpeg': require('../../assets/images/pets/Nala.jpeg'),
  'Nora.jpeg': require('../../assets/images/pets/Nora.jpeg'),
  'Tippy.jpeg': require('../../assets/images/pets/Tippy.jpeg'),
};

export function normalizePetAssetKey(uri: string): string {
  if (!uri) {
    return '';
  }
  return uri
    .replace(/^asset:/i, '')
    .replace(/^bundled:/i, '')
    .replace(/^assets\/images\/pets\//i, '')
    .replace(/^\/?images\/pets\//i, '')
    .trim();
}

export function isBundledPetImageKey(uri: string): boolean {
  if (!uri) {
    return false;
  }
  const normalized = normalizePetAssetKey(uri);
  return normalized in BUNDLED_PET_IMAGES;
}

export function resolvePetImageSource(
  photoUri: string | null | undefined
): ImageSourcePropType | null {
  if (!photoUri) {
    return null;
  }

  const normalized = normalizePetAssetKey(photoUri);
  if (normalized in BUNDLED_PET_IMAGES) {
    return BUNDLED_PET_IMAGES[normalized];
  }

  if (
    photoUri.startsWith('file:') ||
    photoUri.startsWith('content:') ||
    photoUri.startsWith('ph:') ||
    photoUri.startsWith('http:') ||
    photoUri.startsWith('https:') ||
    photoUri.startsWith('data:')
  ) {
    return { uri: photoUri };
  }

  return null;
}

export function getBundledPetImageKeys(): string[] {
  return Object.keys(BUNDLED_PET_IMAGES);
}
