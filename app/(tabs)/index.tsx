import React, { useState, useRef, useEffect } from "react";
import {
   View,
   Text,
   TouchableOpacity,
   StyleSheet,
   Dimensions,
   Animated,
   StatusBar,
   Alert,
   ActivityIndicator,
   Modal,
} from "react-native";
import {
   CameraView,
   CameraType,
   FlashMode,
   useCameraPermissions,
} from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface AspectRatioOption {
   label: string;
   value: "4:3" | "16:9" | "1:1";
}

const ASPECT_RATIOS: AspectRatioOption[] = [
   { label: "4:3", value: "4:3" },
   { label: "16:9", value: "16:9" },
   { label: "1:1", value: "1:1" },
];

export default function CameraScreen() {
   const [permission, requestPermission] = useCameraPermissions();
   const [facing, setFacing] = useState<CameraType>("back");
   const [flashMode, setFlashMode] = useState<FlashMode>("off");
   const [isCapturing, setIsCapturing] = useState(false);
   const [location, setLocation] = useState<Location.LocationObject | null>(
      null,
   );
   const [address, setAddress] = useState<string>("Fetching location...");
   const [showGrid, setShowGrid] = useState(false);
   const [zoomLevel, setZoomLevel] = useState(0);
   const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9" | "1:1">(
      "4:3",
   );
   const [showAspectMenu, setShowAspectMenu] = useState(false);

   const cameraRef = useRef<any>(null);
   const captureAnimation = useRef(new Animated.Value(1)).current;
   const pulseAnimation = useRef(new Animated.Value(1)).current;

   useEffect(() => {
      (async () => {
         if (!permission?.granted) {
            await requestPermission();
         }

         const { status: locationStatus } =
            await Location.requestForegroundPermissionsAsync();
         const { status: mediaStatus } =
            await MediaLibrary.requestPermissionsAsync();

         if (locationStatus === "granted") {
            startLocationTracking();
         }
      })();
   }, [permission]);

   useEffect(() => {
      Animated.loop(
         Animated.sequence([
            Animated.timing(pulseAnimation, {
               toValue: 1.2,
               duration: 1000,
               useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
               toValue: 1,
               duration: 1000,
               useNativeDriver: true,
            }),
         ]),
      ).start();
   }, []);

   const startLocationTracking = async () => {
      try {
         const locationSubscription = await Location.watchPositionAsync(
            {
               accuracy: Location.Accuracy.High,
               timeInterval: 5000,
               distanceInterval: 5,
            },
            async (newLocation) => {
               setLocation(newLocation);

               try {
                  const reverseGeocode = await Location.reverseGeocodeAsync({
                     latitude: newLocation.coords.latitude,
                     longitude: newLocation.coords.longitude,
                  });

                  if (reverseGeocode.length > 0) {
                     const place = reverseGeocode[0];
                     const formattedAddress = [
                        place.name,
                        place.street,
                        place.city,
                        place.region,
                        place.country,
                     ]
                        .filter(Boolean)
                        .join(", ");

                     setAddress(formattedAddress || "Unknown location");
                  }
               } catch (error) {
                  const lat = newLocation.coords.latitude;
                  const lon = newLocation.coords.longitude;
                  setAddress(`${lat?.toFixed(4)}°, ${lon?.toFixed(4)}°`);
               }
            },
         );

         return () => {
            if (locationSubscription) {
               locationSubscription.remove();
            }
         };
      } catch (error) {
         console.error("Location tracking error:", error);
      }
   };

   const takePicture = async () => {
      if (cameraRef.current && !isCapturing) {
         setIsCapturing(true);

         Animated.sequence([
            Animated.timing(captureAnimation, {
               toValue: 0.8,
               duration: 100,
               useNativeDriver: true,
            }),
            Animated.timing(captureAnimation, {
               toValue: 1,
               duration: 100,
               useNativeDriver: true,
            }),
         ]).start();

         try {
            const photo = await cameraRef.current.takePictureAsync({
               quality: 0.9,
               base64: false,
               exif: true,
            });

            // @ts-ignore
            const appFolder = `${FileSystem.documentDirectory}GPSSnapPhotos/`;
            const folderInfo = await FileSystem.getInfoAsync(appFolder);

            if (!folderInfo.exists) {
               await FileSystem.makeDirectoryAsync(appFolder, {
                  intermediates: true,
               });
            }

            const fileName = `GPS_${Date.now()}.jpg`;
            const newPath = appFolder + fileName;

            await FileSystem.copyAsync({
               from: photo.uri,
               to: newPath,
            });

            // Save metadata
            const metadata = {
               uri: newPath,
               location,
               address,
               timestamp: new Date().toISOString(),
               aspectRatio,
            };

            const metadataPath =
               appFolder + fileName.replace(".jpg", "_metadata.json");
            await FileSystem.writeAsStringAsync(
               metadataPath,
               JSON.stringify(metadata),
            );

            // Also save to media library
            await MediaLibrary.saveToLibraryAsync(photo.uri);

            Alert.alert("Success", "Photo saved!");
         } catch (error) {
            console.error("Error taking picture:", error);
            Alert.alert("Error", "Failed to take picture");
         } finally {
            setIsCapturing(false);
         }
      }
   };

   const toggleCameraFacing = () => {
      setFacing((current) => (current === "back" ? "front" : "back"));
   };

   const toggleFlash = () => {
      setFlashMode((current) => {
         switch (current) {
            case "off":
               return "on";
            case "on":
               return "auto";
            case "auto":
               return "off";
            default:
               return "off";
         }
      });
   };

   const getFlashIcon = () => {
      switch (flashMode) {
         case "on":
            return "flash-on";
         case "off":
            return "flash-off";
         case "auto":
            return "flash-auto";
         default:
            return "flash-off";
      }
   };

   if (!permission) {
      return (
         <View style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
         </View>
      );
   }

   if (!permission.granted) {
      return (
         <View style={styles.container}>
            <Text style={styles.permissionText}>
               GPS Snap needs camera permission to work
            </Text>
            <TouchableOpacity
               style={styles.permissionButton}
               onPress={requestPermission}
            >
               <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
         </View>
      );
   }

   return (
      <View style={styles.container}>
         <StatusBar hidden />

         <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flashMode}
            zoom={zoomLevel}
            ratio={aspectRatio ?? "4:3"}
         >
            {/* Top Controls Bar */}
            <BlurView intensity={30} style={styles.topBar}>
               <TouchableOpacity
                  style={styles.topControl}
                  onPress={toggleFlash}
               >
                  <MaterialIcons name={getFlashIcon()} size={24} color="#fff" />
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.topControl}
                  onPress={() => setShowAspectMenu(!showAspectMenu)}
               >
                  <Text style={styles.aspectText}>{aspectRatio}</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.topControl}
                  onPress={() => setShowGrid(!showGrid)}
               >
                  <MaterialIcons
                     name="grid-on"
                     size={24}
                     color={showGrid ? "#FFD700" : "#fff"}
                  />
               </TouchableOpacity>
            </BlurView>

            {/* Aspect Ratio Menu */}
            {showAspectMenu && (
               <BlurView intensity={50} style={styles.aspectMenu}>
                  {ASPECT_RATIOS.map((ratio) => (
                     <TouchableOpacity
                        key={ratio.value}
                        style={[
                           styles.aspectMenuItem,
                           aspectRatio === ratio.value &&
                              styles.aspectMenuItemActive,
                        ]}
                        onPress={() => {
                           setAspectRatio(ratio.value);
                           setShowAspectMenu(false);
                        }}
                     >
                        <Text
                           style={[
                              styles.aspectMenuText,
                              aspectRatio === ratio.value &&
                                 styles.aspectMenuTextActive,
                           ]}
                        >
                           {ratio.label}
                        </Text>
                     </TouchableOpacity>
                  ))}
               </BlurView>
            )}

            {/* Grid Overlay */}
            {showGrid && (
               <View style={styles.gridContainer} pointerEvents="none">
                  <View style={styles.gridRow}>
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                  </View>
                  <View style={styles.gridRow}>
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                  </View>
                  <View style={styles.gridRow}>
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                     <View style={styles.gridCell} />
                  </View>
               </View>
            )}

            {/* Location Info Display */}
            {/* <Animated.View
               style={[
                  styles.locationInfo,
                  { transform: [{ scale: pulseAnimation }] },
               ]}
            >
               <BlurView intensity={50} style={styles.locationBlur}>
                  <View style={styles.locationContent}>
                     <Ionicons name="location" size={16} color="#FFD700" />
                     <Text style={styles.locationText} numberOfLines={1}>
                        {address}
                     </Text>
                  </View>
                  {location?.coords && (
                     <Text style={styles.coordsText}>
                        {location.coords.latitude?.toFixed(6)}°,{" "}
                        {location.coords.longitude?.toFixed(6)}°
                     </Text>
                  )}
               </BlurView>
            </Animated.View> */}

            {/* Location Stamp Preview - Shows how the final stamp will look */}
            <View style={styles.stampPreview}>
               {/* Watermark preview */}
               <Image
                  source={require("@/assets/images/geo.jpg")}
                  style={styles.watermarkPreview}
                  resizeMode="contain"
               />

               <View className="flex flex-col items-start justify-center">
                  <Text style={styles.stampLocationText} numberOfLines={2}>
                     {address}
                  </Text>
                  <Text style={styles.stampDateTimeText}>
                     {new Date().toLocaleString()}
                  </Text>
                  {location?.coords && (
                     <Text style={styles.stampCoordsText}>
                        Lat: {location.coords.latitude?.toFixed(6)}° Long:{" "}
                        {location.coords.longitude?.toFixed(6)}°
                     </Text>
                  )}
               </View>
            </View>

            {/* Zoom Slider */}
            <View style={styles.zoomContainer}>
               <Text style={styles.zoomText}>1×</Text>
               <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={zoomLevel}
                  onValueChange={setZoomLevel}
                  minimumTrackTintColor="#FFD700"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#FFD700"
               />
               <Text style={styles.zoomText}>10×</Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
               <TouchableOpacity style={styles.galleryButton}>
                  <Ionicons name="images-outline" size={30} color="#fff" />
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={takePicture}
                  disabled={isCapturing}
                  style={styles.captureButtonContainer}
               >
                  <Animated.View
                     style={[
                        styles.captureButton,
                        { transform: [{ scale: captureAnimation }] },
                     ]}
                  >
                     {isCapturing ? (
                        <ActivityIndicator size="large" color="#fff" />
                     ) : (
                        <View style={styles.captureButtonInner} />
                     )}
                  </Animated.View>
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.flipButton}
                  onPress={toggleCameraFacing}
               >
                  <Ionicons
                     name="camera-reverse-outline"
                     size={30}
                     color="#fff"
                  />
               </TouchableOpacity>
            </View>
         </CameraView>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
   },
   camera: {
      flex: 1,
      width: "100%",
   },
   topBar: {
      position: "absolute",
      top: 40,
      left: 20,
      right: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 10,
      zIndex: 10,
   },
   topControl: {
      padding: 8,
   },
   aspectText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
   },
   aspectMenu: {
      position: "absolute",
      top: 100,
      right: 20,
      borderRadius: 12,
      overflow: "hidden",
      zIndex: 10,
   },
   aspectMenuItem: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
   },
   aspectMenuItemActive: {
      backgroundColor: "rgba(255, 215, 0, 0.2)",
   },
   aspectMenuText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "500",
   },
   aspectMenuTextActive: {
      color: "#FFD700",
      fontWeight: "700",
   },
   gridContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
   },
   gridRow: {
      flex: 1,
      flexDirection: "row",
   },
   gridCell: {
      flex: 1,
      borderWidth: 0.5,
      borderColor: "rgba(255, 255, 255, 0.3)",
   },
   locationInfo: {
      position: "absolute",
      top: 120,
      left: 20,
      right: 20,
      zIndex: 5,
   },
   locationBlur: {
      borderRadius: 15,
      overflow: "hidden",
      padding: 12,
   },
   locationContent: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
   },
   locationText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
      flex: 1,
   },
   coordsText: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 11,
      marginLeft: 24,
      fontFamily: "monospace",
   },
   zoomContainer: {
      position: "absolute",
      bottom: 140,
      left: 40,
      right: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
   },
   slider: {
      flex: 1,
      marginHorizontal: 10,
   },
   zoomText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
   },
   bottomControls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingHorizontal: 40,
   },
   captureButtonContainer: {
      alignItems: "center",
      justifyContent: "center",
   },
   captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 4,
      borderColor: "#fff",
   },
   captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#fff",
   },
   galleryButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
   },
   flipButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
   },
   permissionText: {
      color: "#fff",
      fontSize: 16,
      textAlign: "center",
      paddingHorizontal: 40,
      marginBottom: 20,
   },
   permissionButton: {
      backgroundColor: "#FFD700",
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
   },
   permissionButtonText: {
      color: "#000",
      fontSize: 16,
      fontWeight: "600",
   },

   stampPreview: {
      position: "absolute",
      top: 140,
      left: 0,
      right: 0,
      alignItems: "center",
   },
   watermarkPreview: {
      position: "absolute",
      left: 20,
      width: 50,
      height: 50,
      opacity: 0.7,
   },
   stampInfoContainer: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      padding: 10,
      borderRadius: 12,
      width: "95%",
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
   },
   stampLocationText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
   },
   stampDateTimeText: {
      color: "#fff",
      fontSize: 12,
      marginBottom: 4,
   },
   stampCoordsText: {
      color: "#fff",
      fontSize: 9,
      fontStyle: "italic",
   },
});
