import * as ImagePicker from 'expo-image-picker';
import { config } from '../config';

/** Opens the gallery and returns the chosen image's local uri, or null if cancelled. */
export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photos ki permission chahiye');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}

/**
 * Uploads a local image straight from the phone to Cloudinary (unsigned preset)
 * and returns the public https URL, which we then save on our backend.
 */
export async function uploadImage(localUri: string): Promise<string> {
  if (!config.cloudinaryCloudName || !config.cloudinaryUploadPreset) {
    throw new Error('Cloudinary .env mein set nahi hai');
  }
  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } for files.
  form.append('file', { uri: localUri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  form.append('upload_preset', config.cloudinaryUploadPreset);
  form.append('folder', 'slowspark');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error('Photo upload nahi ho paayi');
  }
  return data.secure_url as string;
}
