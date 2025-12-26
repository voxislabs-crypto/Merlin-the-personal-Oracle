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
  private static readonly NOMINATIM_BASE_URL =
    "https://nominatim.openstreetmap.org/search";

  static async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "10",
        countrycodes:
          "us,gb,fr,de,it,es,ca,mx,jp,au,ru,br,in,za,nz,ie,ch,at,se,dk,fi,no,pl,cz,hu,pt,gr,be,nl,lu",
      });

      const response = await fetch(`${this.NOMINATIM_BASE_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return data
        .map((item: any) => {
          const address = item.address || {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.name ||
            "";
          const state = address.state || address.region || "";
          const country = address.country || "";

          return {
            city,
            state,
            country,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            displayName:
              item.display_name ||
              `${city}, ${state}, ${country}`
                .replace(/,,/g, ",")
                .replace(/, $/, ""),
          };
        })
        .filter((result: GeocodingResult) => result.city)
        .slice(0, 5);
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
        format: "json",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) return null;

      const address = data.address || {};
      const city =
        address.city || address.town || address.village || address.name || "";
      const state = address.state || address.region || "";
      const country = address.country || "";

      return {
        city,
        state,
        country,
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        displayName:
          data.display_name ||
          `${city}, ${state}, ${country}`
            .replace(/,,/g, ",")
            .replace(/, $/, ""),
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }
}
