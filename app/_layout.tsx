import {
   DarkTheme,
   DefaultTheme,
   ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

export default function RootLayout() {
   // Always use dark theme since we removed light theme
   const colorScheme = "dark";
   const [loaded] = useFonts({
      SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
   });

   useEffect(() => {
      if (loaded) {
         // Keep the splash screen visible for 3 seconds
         const timer = setTimeout(() => {
            SplashScreen.hideAsync().catch((err) => {
               console.error(
                  "Failed to hide splash screen after fonts loaded:",
                  err,
               );
            });
         }, 3000); // 3 seconds delay

         return () => clearTimeout(timer);
      }
   }, [loaded]);

   if (!loaded) {
      // Async font loading only occurs in development.
      return null;
   }

   return (
      <ThemeProvider value={DarkTheme}>
         <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
         </Stack>
         <StatusBar style="light" />
      </ThemeProvider>
   );
}
