import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.extra?.googleMapsApiKey || 'AIzaSyCr6d4xZw6apWLl0VRVgDLytC8VDhLMdEI';

type GeocodeAddress = {
  country?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
};

const getAddress = (components: any[] = []): GeocodeAddress => {
  const find = (...types: string[]) =>
    components.find(component => types.some(type => component.types?.includes(type)))?.long_name;

  return {
    country: find('country'),
    city: find('locality', 'postal_town'),
    town: find('administrative_area_level_2'),
    village: find('administrative_area_level_3'),
    suburb: find('sublocality', 'sublocality_level_1', 'neighborhood'),
    state: find('administrative_area_level_1'),
  };
};

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
        display_name: res.formatted_address,
        address: getAddress(res.address_components),
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
        display_name: data.results[0].formatted_address,
        address: getAddress(data.results[0].address_components),
      };
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
  }

  return null;
};
