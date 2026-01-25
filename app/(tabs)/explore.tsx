import React, { useState, useEffect } from "react";
import {
   View,
   FlatList,
   Alert,
   TouchableOpacity,
   Modal,
   Dimensions,
   StatusBar,
   Text,
   RefreshControl,
   ActivityIndicator,
   StyleSheet,
   ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 4) / 3; // 3 columns with 1px gaps

interface PhotoMetadata {
   uri: string;
   location: any;
   address: string;
   timestamp: string;
   aspectRatio: string;
   filename: string;
}

export default function GalleryScreen() {
   const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
   const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(
      null,
   );
   const [modalVisible, setModalVisible] = useState(false);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   useEffect(() => {
      loadPhotos();
   }, []);

   const loadPhotos = async () => {
      try {
         // @ts-ignore
         const appFolder = `${FileSystem.documentDirectory}GPSSnapPhotos/`;
         const folderInfo = await FileSystem.getInfoAsync(appFolder);

         if (!folderInfo.exists) {
            setPhotos([]);
            setLoading(false);
            return;
         }

         const files = await FileSystem.readDirectoryAsync(appFolder);
         const photoFiles = files.filter((file) => file.endsWith(".jpg"));

         const photosWithMetadata: PhotoMetadata[] = [];

         for (const photoFile of photoFiles) {
            const metadataFile = photoFile.replace(".jpg", "_metadata.json");
            const metadataPath = appFolder + metadataFile;

            try {
               const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
               if (metadataInfo.exists) {
                  const metadataString = await FileSystem.readAsStringAsync(
                     metadataPath,
                  );
                  const metadata = JSON.parse(metadataString);
                  photosWithMetadata.push(metadata);
               } else {
                  // If no metadata, still show the photo
                  photosWithMetadata.push({
                     uri: appFolder + photoFile,
                     location: null,
                     address: "Location not available",
                     timestamp: new Date().toISOString(),
                     aspectRatio: "4:3",
                     filename: photoFile,
                  });
               }
            } catch (error) {
               console.error("Error reading metadata:", error);
            }
         }

         // Sort by timestamp (newest first)
         photosWithMetadata.sort(
            (a, b) =>
               new Date(b.timestamp).getTime() -
               new Date(a.timestamp).getTime(),
         );

         setPhotos(photosWithMetadata);
      } catch (error) {
         console.error("Error loading photos:", error);
         Alert.alert("Error", "Failed to load photos");
      } finally {
         setLoading(false);
      }
   };

   const onRefresh = async () => {
      setRefreshing(true);
      await loadPhotos();
      setRefreshing(false);
   };

   const handlePhotoPress = (photo: PhotoMetadata) => {
      setSelectedPhoto(photo);
      setModalVisible(true);
   };

   const closeModal = () => {
      setModalVisible(false);
      setSelectedPhoto(null);
   };

   const deletePhoto = async () => {
      if (!selectedPhoto) return;

      Alert.alert(
         "Delete Photo",
         "Are you sure you want to delete this photo?",
         [
            { text: "Cancel", style: "cancel" },
            {
               text: "Delete",
               style: "destructive",
               onPress: async () => {
                  try {
                     await FileSystem.deleteAsync(selectedPhoto.uri);
                     const metadataPath = selectedPhoto.uri.replace(
                        ".jpg",
                        "_metadata.json",
                     );
                     const metadataInfo = await FileSystem.getInfoAsync(
                        metadataPath,
                     );
                     if (metadataInfo.exists) {
                        await FileSystem.deleteAsync(metadataPath);
                     }

                     closeModal();
                     await loadPhotos();
                     Alert.alert("Success", "Photo deleted");
                  } catch (error) {
                     console.error("Error deleting photo:", error);
                     Alert.alert("Error", "Failed to delete photo");
                  }
               },
            },
         ],
      );
   };

   const formatDate = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   const renderPhoto = ({ item }: { item: PhotoMetadata }) => (
      <TouchableOpacity
         style={styles.photoContainer}
         onPress={() => handlePhotoPress(item)}
         activeOpacity={0.8}
      >
         <Image
            source={{ uri: item.uri }}
            style={styles.photo}
            contentFit="cover"
         />
      </TouchableOpacity>
   );

   const renderEmptyState = () => (
      <View style={styles.emptyStateContainer}>
         <Text style={styles.emptyStateIcon}>📸</Text>
         <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
         <Text style={styles.emptyStateSubtitle}>
            Start capturing memories with GPS location data
         </Text>
      </View>
   );

   const renderLoadingState = () => (
      <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#FFD700" />
         <Text style={styles.loadingText}>Loading your gallery...</Text>
      </View>
   );

   if (loading) {
      return (
         <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <View style={styles.container}>{renderLoadingState()}</View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.safeArea}>
         <StatusBar barStyle="light-content" backgroundColor="#000000" />
         <View style={styles.container}>
            <View style={styles.header}>
               <Text style={styles.title}>Gallery</Text>
               <Text style={styles.photoCount}>
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
               </Text>
            </View>

            {photos.length === 0 ? (
               renderEmptyState()
            ) : (
               <FlatList
                  data={photos}
                  renderItem={renderPhoto}
                  keyExtractor={(item, index) => `${item.filename}-${index}`}
                  numColumns={3}
                  contentContainerStyle={styles.photoGrid}
                  showsVerticalScrollIndicator={false}
                  columnWrapperStyle={styles.row}
                  refreshControl={
                     <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFD700"
                     />
                  }
               />
            )}

            {/* Photo Viewer Modal */}
            <Modal
               animationType="fade"
               transparent={false}
               visible={modalVisible}
               onRequestClose={closeModal}
            >
               <View style={styles.modalContainer}>
                  <StatusBar barStyle="light-content" />

                  {/* Header with close and delete buttons */}
                  <View style={styles.modalHeader}>
                     <TouchableOpacity
                        onPress={closeModal}
                        style={styles.modalButton}
                     >
                        <Ionicons name="close" size={28} color="#fff" />
                     </TouchableOpacity>

                     <TouchableOpacity
                        onPress={deletePhoto}
                        style={styles.modalButton}
                     >
                        <Ionicons
                           name="trash-outline"
                           size={24}
                           color="#ff3b30"
                        />
                     </TouchableOpacity>
                  </View>

                  {selectedPhoto && (
                     <>
                        <Image
                           source={{ uri: selectedPhoto.uri }}
                           style={styles.modalImage}
                           contentFit="contain"
                        />

                        {/* Metadata Overlay */}
                        <BlurView
                           intensity={80}
                           style={styles.metadataContainer}
                        >
                           <ScrollView showsVerticalScrollIndicator={false}>
                              <View style={styles.metadataRow}>
                                 <Ionicons
                                    name="time-outline"
                                    size={20}
                                    color="#FFD700"
                                 />
                                 <View style={styles.metadataTextContainer}>
                                    <Text style={styles.metadataLabel}>
                                       Date & Time
                                    </Text>
                                    <Text style={styles.metadataValue}>
                                       {formatDate(selectedPhoto.timestamp)}
                                    </Text>
                                 </View>
                              </View>

                              {selectedPhoto.location && (
                                 <>
                                    <View style={styles.metadataRow}>
                                       <Ionicons
                                          name="location"
                                          size={20}
                                          color="#FFD700"
                                       />
                                       <View
                                          style={styles.metadataTextContainer}
                                       >
                                          <Text style={styles.metadataLabel}>
                                             Location
                                          </Text>
                                          <Text style={styles.metadataValue}>
                                             {selectedPhoto.address}
                                          </Text>
                                       </View>
                                    </View>

                                    <View style={styles.metadataRow}>
                                       <Ionicons
                                          name="compass-outline"
                                          size={20}
                                          color="#FFD700"
                                       />
                                       <View
                                          style={styles.metadataTextContainer}
                                       >
                                          <Text style={styles.metadataLabel}>
                                             Coordinates
                                          </Text>
                                          <Text style={styles.metadataValue}>
                                             {selectedPhoto.location.coords?.latitude?.toFixed(
                                                6,
                                             )}
                                             °,{" "}
                                             {selectedPhoto.location.coords?.longitude?.toFixed(
                                                6,
                                             )}
                                             °
                                          </Text>
                                       </View>
                                    </View>

                                    {selectedPhoto.location.coords
                                       ?.altitude && (
                                       <View style={styles.metadataRow}>
                                          <Ionicons
                                             name="trending-up-outline"
                                             size={20}
                                             color="#FFD700"
                                          />
                                          <View
                                             style={
                                                styles.metadataTextContainer
                                             }
                                          >
                                             <Text style={styles.metadataLabel}>
                                                Altitude
                                             </Text>
                                             <Text style={styles.metadataValue}>
                                                {selectedPhoto.location.coords.altitude.toFixed(
                                                   1,
                                                )}
                                                m
                                             </Text>
                                          </View>
                                       </View>
                                    )}
                                 </>
                              )}

                              <View style={styles.metadataRow}>
                                 <Ionicons
                                    name="image-outline"
                                    size={20}
                                    color="#FFD700"
                                 />
                                 <View style={styles.metadataTextContainer}>
                                    <Text style={styles.metadataLabel}>
                                       Aspect Ratio
                                    </Text>
                                    <Text style={styles.metadataValue}>
                                       {selectedPhoto.aspectRatio}
                                    </Text>
                                 </View>
                              </View>
                           </ScrollView>
                        </BlurView>
                     </>
                  )}
               </View>
            </Modal>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   safeArea: {
      flex: 1,
      backgroundColor: "#000000",
   },
   container: {
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
   photoCount: {
      fontSize: 16,
      color: "#8E8E93",
      marginTop: 4,
      fontWeight: "500",
   },
   photoGrid: {
      paddingTop: 1,
      paddingBottom: 32,
   },
   row: {
      justifyContent: "flex-start",
      marginBottom: 1,
      paddingHorizontal: 0,
   },
   photoContainer: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      backgroundColor: "#1C1C1E",
      marginRight: 1,
   },
   photo: {
      width: "100%",
      height: "100%",
   },
   emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
   },
   emptyStateIcon: {
      fontSize: 64,
      marginBottom: 24,
   },
   emptyStateTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 8,
      textAlign: "center",
   },
   emptyStateSubtitle: {
      fontSize: 16,
      color: "#8E8E93",
      textAlign: "center",
      lineHeight: 22,
   },
   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   loadingText: {
      fontSize: 16,
      color: "#8E8E93",
      fontWeight: "500",
      marginTop: 16,
   },
   modalContainer: {
      flex: 1,
      backgroundColor: "#000",
   },
   modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
   },
   modalButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      alignItems: "center",
      justifyContent: "center",
   },
   modalImage: {
      flex: 1,
      width: "100%",
   },
   metadataContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: "40%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
      padding: 20,
   },
   metadataRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
   },
   metadataTextContainer: {
      flex: 1,
      marginLeft: 12,
   },
   metadataLabel: {
      fontSize: 12,
      color: "#8E8E93",
      fontWeight: "600",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
   },
   metadataValue: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
   },
});
