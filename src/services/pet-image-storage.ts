import { Directory, File, Paths } from 'expo-file-system';

import { isBundledPetImageKey } from './pet-assets';

const PET_IMAGE_DIRECTORY = new Directory(Paths.document, 'pet-show-and-tell-images');

export async function copyPetImageIntoAppStorage(sourceUri: string) {
  if (
    sourceUri.startsWith('seed:') ||
    sourceUri.startsWith('asset:') ||
    sourceUri.startsWith('bundled:') ||
    isBundledPetImageKey(sourceUri)
  ) {
    return sourceUri;
  }

  PET_IMAGE_DIRECTORY.create({ idempotent: true, intermediates: true });
  const cleanUri = sourceUri.split('?')[0] ?? sourceUri;
  const maybeExtension = cleanUri.split('.').pop()?.toLowerCase();
  const extension =
    maybeExtension && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(maybeExtension)
      ? maybeExtension
      : 'jpg';
  const destination = new File(
    PET_IMAGE_DIRECTORY,
    'pet-photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + extension
  );
  await new File(sourceUri).copy(destination);
  return destination.uri;
}
