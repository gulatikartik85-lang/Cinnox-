// Capacitor Configuration for Android APK & AAB Packaging with Google AdMob
// To build the native Android APK / AAB locally:
//   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/admob
//   npm run build
//   npx cap add android
//   npx cap sync android
//   npx cap open android  (or run ./gradlew assembleRelease / bundleRelease)

const config = {
  appId: 'com.helpworld.ai',
  appName: 'HelpWorld AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For pointing the packaged Android APK to your deployed API backend:
    // url: 'https://your-helpworld-backend.example.com',
  },
  plugins: {
    AdMob: {
      // Replace with your live AdMob App ID in android/app/src/main/res/values/strings.xml
      // Official Google Test App ID: ca-app-pub-3940256099942544~3347511713
      initializeForTesting: true,
    },
  },
};

export default config;
