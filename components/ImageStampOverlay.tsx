import React from 'react';
import { View, Text, Image } from 'react-native';

interface ImageStampOverlayProps {
  photoUri: string;
  locationText: string;
  dateTimeText: string;
  latitude?: number | null;
  longitude?: number | null;
  style?: any;
}

export const ImageStampOverlay: React.FC<ImageStampOverlayProps> = ({
  photoUri,
  locationText,
  dateTimeText,
  latitude,
  longitude,
  style,
}) => {
  return (
    <View className="flex-1 bg-black" style={style} collapsable={false}>
      <Image 
        source={{ uri: photoUri }} 
        className="w-full h-full"
        resizeMode="cover" 
      />
      <View className="absolute inset-0 justify-end items-start">
        {/* Watermark positioned at bottom-left as requested */}
        <Image 
          source={require('@/assets/images/geo.jpg')} 
          className="absolute bottom-5 left-5 w-20 h-20 opacity-70 z-[1000]"
          resizeMode="contain"
        />
        <View className="flex-row justify-center items-center w-full mb-5">
          <View className="bg-black/50 p-3 rounded-lg w-[90%] items-center">
            <Text className="text-white text-base font-bold flex-2 text-left" numberOfLines={2}>
              {locationText}
            </Text>
            <Text className="text-white text-sm flex-1 text-center">
              {dateTimeText}
            </Text>
            {latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null && (
              <Text className="text-white text-xs italic flex-1 text-right">
                Lat: {latitude.toFixed(6)}° Long: {longitude.toFixed(6)}°
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
