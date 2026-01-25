import React from 'react';
import { View, Text, Image } from 'react-native';

interface StampedImageViewProps {
  photoUri: string;
  locationText: string;
  dateTimeText: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const StampedImageView: React.FC<StampedImageViewProps> = ({
  photoUri,
  locationText,
  dateTimeText,
  latitude,
  longitude,
}) => {
  return (
    <View className="w-[400px] h-[600px] bg-black" collapsable={false}>
      <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
      <View className="absolute inset-0 justify-end items-center">
        {/* Watermark image */}
        <Image 
          source={require('@/assets/images/geo.jpg')} 
          className="absolute top-5 right-5 w-20 h-20 opacity-70"
          resizeMode="contain"
        />
        <View className="bg-black/50 p-3 rounded-lg w-[90%] items-center">
          <View className="flex-row justify-between items-center w-full">
            <Text className="text-white text-base font-bold flex-2 text-left" numberOfLines={2}>{locationText}</Text>
            <Text className="text-white text-sm flex-1 text-center">{dateTimeText}</Text>
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
