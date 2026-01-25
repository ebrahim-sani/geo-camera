import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

export const createStampedImage = async (
  viewRef: React.RefObject<any>
): Promise<string | null> => {
  try {
    if (viewRef.current) {
      // Capture the view with overlay text
      const uri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.9, // Increased quality for better image
        result: 'tmpfile',
      });
      
      return uri;
    }
    return null;
  } catch (error) {
    console.error('Error creating stamped image:', error);
    return null;
  }
};

export const saveStampedImage = async (
  stampedImageUri: string,
  filename: string
): Promise<string | null> => {
  try {
    // Move the file to a permanent location
    const stampedImagePath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.moveAsync({
      from: stampedImageUri,
      to: stampedImagePath,
    });
    
    return stampedImagePath;
  } catch (error) {
    console.error('Error saving stamped image:', error);
    return null;
  }
};

export const formatLocationText = (lat: number | null, lon: number | null, address: string | null): string => {
  if (!lat || !lon) return 'No location';
  
  if (address) {
    return address;
  }
  
  return `Lat: ${lat.toFixed(4)}° Long: ${lon.toFixed(4)}°`;
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const generateFilename = (date: Date, lat: number | null, lon: number | null): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  if (lat && lon) {
    // Remove negative signs and decimal points for filename
    const latStr = Math.abs(lat).toFixed(6).replace('.', '');
    const lonStr = Math.abs(lon).toFixed(6).replace('.', '');
    const latHemisphere = lat >= 0 ? 'N' : 'S';
    const lonHemisphere = lon >= 0 ? 'E' : 'W';
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}_${latHemisphere}${latStr}_${lonHemisphere}${lonStr}.jpg`;
  }
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}.jpg`;
};