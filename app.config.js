import 'dotenv/config'; // This loads your .env file

export default {
  expo: {
    name: "SIBOL",
    slug: "SIBOL",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "$(PRODUCT_NAME) needs access to your Camera.",
        ITSAppUsesNonExemptEncryption: false
      },
      bundleIdentifier: "com.sprout.SIBOLmobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.sprout.SIBOLmobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b726f662-b79e-47cb-bae8-5f37e7c65663"
      },

      // ✅ New split base URLs
      EXPO_PUBLIC_API_BASE_WEB: process.env.EXPO_PUBLIC_API_BASE_WEB,
      EXPO_PUBLIC_API_BASE_MOBILE: process.env.EXPO_PUBLIC_API_BASE_MOBILE,
      GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    },
    scheme: "sibol",
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          // Dummy iOS URL scheme (required by plugin even if not building for iOS)
          // When you create an iOS OAuth client, replace this with the actual reversed client ID
          iosUrlScheme: "com.googleusercontent.apps.placeholder"
        }
      ]
    ]
  }
};