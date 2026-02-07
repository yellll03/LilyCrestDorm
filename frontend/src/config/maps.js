// Google Maps API Configuration
export const GOOGLE_MAPS_API_KEY = "AIzaSyBnOAv1sLnBLmW9y4EP6xRhGScT_0CpTOE";

// Google Maps configuration for react-native-maps or web maps
export const MAPS_CONFIG = {
  apiKey: GOOGLE_MAPS_API_KEY,
  libraries: ['places', 'geometry'], // Common libraries needed
  region: 'PH', // Philippines
  language: 'en',
};

// Default map settings
export const DEFAULT_MAP_REGION = {
  latitude: 14.5995, // Manila, Philippines
  longitude: 120.9842,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default GOOGLE_MAPS_API_KEY;
