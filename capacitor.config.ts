// Capacitor Configuration for Android APK & AAB Packaging with Google AdMob
// To build an Android APK / AAB locally:
//   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/admob
//   npm run build
//   npx cap add android
//   npx cap sync android
//   npx cap open android  (or run ./gradlew bundleRelease / assembleRelease)

const config = {
  appId: 'com.cinnox.app',
  appName: 'Cinnox',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    AdMob: {
      // Replace with your real AdMob App ID in android/app/src/main/res/values/strings.xml
      // Sample Test App ID: ca-app-pub-3940256099942544~3347511713
      initializeForTesting: true,
    },
  },
};

export default config;
