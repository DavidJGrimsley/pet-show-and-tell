import { isBundledPetImageKey } from './pet-assets';

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error('This picture could not be saved in the browser preview.'));
    };
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
        resolve(reader.result);
        return;
      }
      reject(new Error('This picture could not be saved in the browser preview.'));
    };
    reader.readAsDataURL(blob);
  });
}

export async function copyPetImageIntoAppStorage(sourceUri: string) {
  if (
    sourceUri.startsWith('seed:') ||
    sourceUri.startsWith('asset:') ||
    sourceUri.startsWith('bundled:') ||
    sourceUri.startsWith('data:') ||
    isBundledPetImageKey(sourceUri)
  ) {
    return sourceUri;
  }

  if (sourceUri.startsWith('blob:')) {
    const response = await fetch(sourceUri);
    if (!response.ok) {
      throw new Error('This picture could not be saved in the browser preview.');
    }
    return readBlobAsDataUrl(await response.blob());
  }

  throw new Error('This picture could not be saved in the browser preview.');
}
