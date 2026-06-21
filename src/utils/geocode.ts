import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.extra?.googleMapsApiKey || 'AIzaSyCr6d4xZw6apWLl0VRVgDLytC8VDhLMdEI';

export const geocodeAddress = async (address: string) => {
  if (!GOOGLE_API_KEY) {
    console.error('Google Maps API key is missing');
    return [];
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:CA&key=${GOOGLE_API_KEY}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map((res: any) => ({
        lat: res.geometry.location.lat,
        lon: res.geometry.location.lng,
        display_name: res.formatted_address
      }));
    }
  } catch (error) {
    console.error('Geocode error:', error);
  }

  return [];
};

export const reverseGeocode = async (lat: number, lon: number) => {
  if (!GOOGLE_API_KEY) {
    console.error('Google Maps API key is missing');
    return null;
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return {
        lat,
        lon,
        display_name: data.results[0].formatted_address
      };
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
  }

  return null;
};
