// lib/astrology/geocoding.ts - Real-world geocoding service
export interface GeocodingResult {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export class GeocodingService {
  static async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/geocoding?${params}`);

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  }

  static async validateLocation(
    city: string,
    state: string = ""
  ): Promise<GeocodingResult | null> {
    const query = state ? `${city}, ${state}` : city;
    const results = await this.searchLocations(query);

    // Find exact match or closest match
    const exactMatch = results.find(
      (result) =>
        result.city.toLowerCase() === city.toLowerCase() &&
        (!state || result.state.toLowerCase() === state.toLowerCase())
    );

    if (exactMatch) return exactMatch;

    // Return first result if no exact match
    return results.length > 0 ? results[0] : null;
  }

  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult | null> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
      });

      const response = await fetch(`/api/geocoding?${params}`);

      if (!response.ok) {
        console.log('Reverse geocoding unavailable:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.result || null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }
}
