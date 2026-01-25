import React, { useState, useEffect } from "react";
import {
   View,
   Switch,
   Alert,
   Platform,
   ScrollView,
   TouchableOpacity,
   Text,
   StyleSheet,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

interface Settings {
   timeFormat: "12h" | "24h";
   watermark: boolean;
   offlineMode: boolean;
   photoQuality: "high" | "medium" | "low";
   gpsAccuracy: "high" | "balanced" | "low";
   autoSaveToGallery: boolean;
   showGrid: boolean;
}

export default function SettingsScreen() {
   const [settings, setSettings] = useState<Settings>({
      timeFormat: "12h",
      watermark: true,
      offlineMode: false,
      photoQuality: "high",
      gpsAccuracy: "high",
      autoSaveToGallery: true,
      showGrid: false,
   });
   const [storageUsed, setStorageUsed] = useState("0 MB");
   const [photoCount, setPhotoCount] = useState(0);

   // @ts-ignore
   const settingsFile = `${FileSystem.documentDirectory}settings.json`;

   useEffect(() => {
      loadSettings();
      calculateStorage();
   }, []);

   const loadSettings = async () => {
      try {
         const fileInfo = await FileSystem.getInfoAsync(settingsFile);
         if (fileInfo.exists) {
            const settingsString = await FileSystem.readAsStringAsync(
               settingsFile,
            );
            const savedSettings = JSON.parse(settingsString);
            setSettings(savedSettings);
         }
      } catch (error) {
         console.log("No existing settings found, using defaults");
      }
   };

   const saveSettings = async (newSettings: Settings) => {
      try {
         await FileSystem.writeAsStringAsync(
            settingsFile,
            JSON.stringify(newSettings),
         );
      } catch (error) {
         console.error("Error saving settings:", error);
         Alert.alert("Error", "Failed to save settings");
      }
   };

   const updateSetting = (key: keyof Settings, value: any) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      saveSettings(newSettings);
   };

   const calculateStorage = async () => {
      try {
         // @ts-ignore
         const appFolder = `${FileSystem.documentDirectory}GPSSnapPhotos/`;
         const folderInfo = await FileSystem.getInfoAsync(appFolder);

         if (folderInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(appFolder);
            const photoFiles = files.filter((file) => file.endsWith(".jpg"));
            setPhotoCount(photoFiles.length);

            let totalSize = 0;
            for (const file of photoFiles) {
               const fileInfo = await FileSystem.getInfoAsync(appFolder + file);
               if (fileInfo.exists && !fileInfo.isDirectory) {
                  totalSize += fileInfo.size || 0;
               }
            }

            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            setStorageUsed(`${sizeMB} MB`);
         }
      } catch (error) {
         console.error("Error calculating storage:", error);
      }
   };

   const clearAllData = () => {
      Alert.alert(
         "Clear All Data",
         "This will delete all photos and settings. This action cannot be undone.",
         [
            { text: "Cancel", style: "cancel" },
            {
               text: "Delete All",
               style: "destructive",
               onPress: async () => {
                  try {
                     // @ts-ignore
                     const appFolder = `${FileSystem.documentDirectory}GPSSnapPhotos/`;
                     const folderInfo = await FileSystem.getInfoAsync(
                        appFolder,
                     );

                     if (folderInfo.exists) {
                        await FileSystem.deleteAsync(appFolder, {
                           idempotent: true,
                        });
                     }

                     await calculateStorage();
                     Alert.alert("Success", "All data has been cleared");
                  } catch (error) {
                     console.error("Error clearing data:", error);
                     Alert.alert("Error", "Failed to clear data");
                  }
               },
            },
         ],
      );
   };

   const renderSection = (
      title: string,
      icon: string,
      children: React.ReactNode,
   ) => (
      <View style={styles.section}>
         <View style={styles.sectionHeader}>
            <Ionicons name={icon as any} size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>{title}</Text>
         </View>
         <View style={styles.settingCard}>{children}</View>
      </View>
   );

   const renderSwitchRow = (
      label: string,
      value: boolean,
      onChange: (value: boolean) => void,
      subtitle?: string,
   ) => (
      <View style={styles.settingRow}>
         <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>{label}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
         </View>
         <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ false: "#3A3A3C", true: "#FFD700" }}
            thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
            ios_backgroundColor="#3A3A3C"
         />
      </View>
   );

   const renderSegmentedControl = (
      label: string,
      options: { value: string; label: string }[],
      selected: string,
      onChange: (value: any) => void,
   ) => (
      <View style={styles.settingRow}>
         <Text style={styles.settingLabel}>{label}</Text>
         <View style={styles.segmentedControl}>
            {options.map((option) => (
               <TouchableOpacity
                  key={option.value}
                  style={[
                     styles.segment,
                     selected === option.value && styles.activeSegment,
                  ]}
                  onPress={() => onChange(option.value)}
               >
                  <Text
                     style={[
                        styles.segmentText,
                        selected === option.value && styles.activeSegmentText,
                     ]}
                  >
                     {option.label}
                  </Text>
               </TouchableOpacity>
            ))}
         </View>
      </View>
   );

   return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.container}>
            <View style={styles.header}>
               <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView
               style={styles.scrollView}
               showsVerticalScrollIndicator={false}
               contentContainerStyle={styles.scrollContent}
            >
               {/* Storage Section */}
               {renderSection(
                  "Storage",
                  "server-outline",
                  <>
                     <View style={styles.storageInfo}>
                        <View style={styles.storageRow}>
                           <Text style={styles.storageLabel}>Photos</Text>
                           <Text style={styles.storageValue}>{photoCount}</Text>
                        </View>
                        <View style={styles.storageRow}>
                           <Text style={styles.storageLabel}>Space Used</Text>
                           <Text style={styles.storageValue}>
                              {storageUsed}
                           </Text>
                        </View>
                     </View>
                     <TouchableOpacity
                        style={styles.dangerButton}
                        onPress={clearAllData}
                     >
                        <Ionicons
                           name="trash-outline"
                           size={20}
                           color="#ff3b30"
                        />
                        <Text style={styles.dangerButtonText}>
                           Clear All Data
                        </Text>
                     </TouchableOpacity>
                  </>,
               )}

               {/* Camera Settings */}
               {renderSection(
                  "Camera",
                  "camera-outline",
                  <>
                     {renderSegmentedControl(
                        "Photo Quality",
                        [
                           { value: "high", label: "High" },
                           { value: "medium", label: "Med" },
                           { value: "low", label: "Low" },
                        ],
                        settings.photoQuality,
                        (value) => updateSetting("photoQuality", value),
                     )}
                     {renderSwitchRow(
                        "Grid Lines",
                        settings.showGrid,
                        (value) => updateSetting("showGrid", value),
                        "Show composition grid on camera",
                     )}
                     {renderSwitchRow(
                        "Auto Save to Gallery",
                        settings.autoSaveToGallery,
                        (value) => updateSetting("autoSaveToGallery", value),
                        "Save copies to device gallery",
                     )}
                  </>,
               )}
               {/* GPS Settings */}
               {renderSection(
                  "Location",
                  "location-outline",
                  <>
                     {renderSegmentedControl(
                        "GPS Accuracy",
                        [
                           { value: "high", label: "High" },
                           { value: "balanced", label: "Balanced" },
                           { value: "low", label: "Low" },
                        ],
                        settings.gpsAccuracy,
                        (value) => updateSetting("gpsAccuracy", value),
                     )}
                     {renderSwitchRow(
                        "Offline Mode",
                        settings.offlineMode,
                        (value) => updateSetting("offlineMode", value),
                        "Save location data locally only",
                     )}
                  </>,
               )}

               {/* Display Settings */}
               {renderSection(
                  "Display",
                  "eye-outline",
                  <>
                     {renderSegmentedControl(
                        "Time Format",
                        [
                           { value: "12h", label: "12h" },
                           { value: "24h", label: "24h" },
                        ],
                        settings.timeFormat,
                        (value) => updateSetting("timeFormat", value),
                     )}
                     {renderSwitchRow(
                        "Watermark",
                        settings.watermark,
                        (value) => updateSetting("watermark", value),
                        "Add GPS Snap watermark to photos",
                     )}
                  </>,
               )}

               {/* About Section */}
               <View style={styles.aboutSection}>
                  <View style={styles.appIcon}>
                     <Ionicons name="camera" size={32} color="#FFD700" />
                  </View>
                  <Text style={styles.appName}>GPS Snap</Text>
                  <Text style={styles.appVersion}>Version 1.0.0</Text>
                  <Text style={styles.appDescription}>
                     Capture moments with precise GPS location data
                  </Text>

                  <View style={styles.infoCards}>
                     <View style={styles.infoCard}>
                        <Ionicons
                           name="shield-checkmark"
                           size={24}
                           color="#34C759"
                        />
                        <Text style={styles.infoCardText}>Privacy First</Text>
                     </View>
                     <View style={styles.infoCard}>
                        <Ionicons
                           name="phone-portrait"
                           size={24}
                           color="#007AFF"
                        />
                        <Text style={styles.infoCardText}>Local Storage</Text>
                     </View>
                     <View style={styles.infoCard}>
                        <Ionicons name="location" size={24} color="#FFD700" />
                        <Text style={styles.infoCardText}>GPS Enabled</Text>
                     </View>
                  </View>

                  <Text style={styles.footerText}>
                     {Platform.OS === "ios"
                        ? "Photos saved to GPS Snap album"
                        : "Photos saved to device gallery"}
                  </Text>
                  <Text style={styles.footerSubtext}>
                     All data stored locally on your device
                  </Text>
               </View>
            </ScrollView>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#000000",
   },
   safeArea: {
      flex: 1,
      backgroundColor: "#000000",
   },
   header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: "#000000",
      borderBottomWidth: 1,
      borderBottomColor: "#1C1C1E",
   },
   title: {
      fontSize: 34,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: -0.5,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingBottom: 40,
   },
   section: {
      marginTop: 24,
      paddingHorizontal: 20,
   },
   sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 4,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      marginLeft: 8,
   },
   settingCard: {
      backgroundColor: "#1C1C1E",
      borderRadius: 16,
      overflow: "hidden",
   },
   settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#2C2C2E",
   },
   settingLabelContainer: {
      flex: 1,
      marginRight: 12,
   },
   settingLabel: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
   },
   settingSubtitle: {
      fontSize: 13,
      color: "#8E8E93",
      marginTop: 2,
   },
   segmentedControl: {
      flexDirection: "row",
      backgroundColor: "#2C2C2E",
      borderRadius: 10,
      padding: 2,
   },
   segment: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 60,
      alignItems: "center",
   },
   activeSegment: {
      backgroundColor: "#FFD700",
   },
   segmentText: {
      color: "#8E8E93",
      fontSize: 14,
      fontWeight: "600",
   },
   activeSegmentText: {
      color: "#000000",
   },
   storageInfo: {
      padding: 16,
   },
   storageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
   },
   storageLabel: {
      fontSize: 16,
      color: "#8E8E93",
      fontWeight: "500",
   },
   storageValue: {
      fontSize: 18,
      color: "#FFFFFF",
      fontWeight: "700",
   },
   dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      backgroundColor: "rgba(255, 59, 48, 0.1)",
      borderTopWidth: 1,
      borderTopColor: "#2C2C2E",
      gap: 8,
   },
   dangerButtonText: {
      color: "#ff3b30",
      fontSize: 16,
      fontWeight: "600",
   },
   aboutSection: {
      marginTop: 32,
      paddingHorizontal: 20,
      alignItems: "center",
      paddingBottom: 20,
   },
   appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: "#1C1C1E",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
   },
   appName: {
      fontSize: 24,
      fontWeight: "800",
      color: "#FFFFFF",
      marginBottom: 4,
   },
   appVersion: {
      fontSize: 14,
      color: "#8E8E93",
      fontWeight: "600",
      marginBottom: 12,
   },
   appDescription: {
      fontSize: 15,
      color: "#8E8E93",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 20,
   },
   infoCards: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 24,
      width: "100%",
   },
   infoCard: {
      flex: 1,
      backgroundColor: "#1C1C1E",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      gap: 8,
   },
   infoCardText: {
      fontSize: 12,
      color: "#FFFFFF",
      fontWeight: "600",
      textAlign: "center",
   },
   footerText: {
      fontSize: 13,
      color: "#8E8E93",
      textAlign: "center",
      marginTop: 8,
   },
   footerSubtext: {
      fontSize: 12,
      color: "#636366",
      textAlign: "center",
      marginTop: 4,
   },
});
