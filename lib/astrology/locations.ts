// lib/astrology/locations.ts
export interface Location {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface LocationSearchResult {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

// Major cities database (simplified - in production would use real geocoding API)
const LOCATION_DATABASE: Location[] = [
  // United States
  {
    city: "New York",
    state: "NY",
    country: "USA",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  },
  {
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: "America/Los_Angeles",
  },
  {
    city: "Chicago",
    state: "IL",
    country: "USA",
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: "America/Chicago",
  },
  {
    city: "Houston",
    state: "TX",
    country: "USA",
    latitude: 29.7604,
    longitude: -95.3698,
    timezone: "America/Chicago",
  },
  {
    city: "Phoenix",
    state: "AZ",
    country: "USA",
    latitude: 33.4484,
    longitude: -112.074,
    timezone: "America/Phoenix",
  },
  {
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    latitude: 39.9526,
    longitude: -75.1652,
    timezone: "America/New_York",
  },
  {
    city: "San Antonio",
    state: "TX",
    country: "USA",
    latitude: 29.4241,
    longitude: -98.4936,
    timezone: "America/Chicago",
  },
  {
    city: "San Diego",
    state: "CA",
    country: "USA",
    latitude: 32.7157,
    longitude: -117.1611,
    timezone: "America/Los_Angeles",
  },
  {
    city: "Dallas",
    state: "TX",
    country: "USA",
    latitude: 32.7767,
    longitude: -96.797,
    timezone: "America/Chicago",
  },
  {
    city: "San Jose",
    state: "CA",
    country: "USA",
    latitude: 37.3382,
    longitude: -121.8863,
    timezone: "America/Los_Angeles",
  },
  {
    city: "Austin",
    state: "TX",
    country: "USA",
    latitude: 30.2672,
    longitude: -97.7431,
    timezone: "America/Chicago",
  },
  {
    city: "Jacksonville",
    state: "FL",
    country: "USA",
    latitude: 30.3322,
    longitude: -81.6557,
    timezone: "America/New_York",
  },
  {
    city: "Fort Worth",
    state: "TX",
    country: "USA",
    latitude: 32.7555,
    longitude: -97.3308,
    timezone: "America/Chicago",
  },
  {
    city: "Columbus",
    state: "OH",
    country: "USA",
    latitude: 39.9612,
    longitude: -82.9988,
    timezone: "America/New_York",
  },
  {
    city: "Charlotte",
    state: "NC",
    country: "USA",
    latitude: 35.2271,
    longitude: -80.8431,
    timezone: "America/New_York",
  },
  {
    city: "San Francisco",
    state: "CA",
    country: "USA",
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: "America/Los_Angeles",
  },
  {
    city: "Indianapolis",
    state: "IN",
    country: "USA",
    latitude: 39.7684,
    longitude: -86.1581,
    timezone: "America/Indiana/Indianapolis",
  },
  {
    city: "Seattle",
    state: "WA",
    country: "USA",
    latitude: 47.6062,
    longitude: -122.3321,
    timezone: "America/Los_Angeles",
  },
  {
    city: "Denver",
    state: "CO",
    country: "USA",
    latitude: 39.7392,
    longitude: -104.9903,
    timezone: "America/Denver",
  },
  {
    city: "Boston",
    state: "MA",
    country: "USA",
    latitude: 42.3601,
    longitude: -71.0589,
    timezone: "America/New_York",
  },
  {
    city: "Norfolk",
    state: "VA",
    country: "USA",
    latitude: 36.8468,
    longitude: -76.2855,
    timezone: "America/New_York",
  },

  // International Cities
  {
    city: "London",
    state: "",
    country: "UK",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
  },
  {
    city: "Paris",
    state: "",
    country: "France",
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: "Europe/Paris",
  },
  {
    city: "Tokyo",
    state: "",
    country: "Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: "Australia/Sydney",
  },
  {
    city: "Toronto",
    state: "ON",
    country: "Canada",
    latitude: 43.6532,
    longitude: -79.3832,
    timezone: "America/Toronto",
  },
  {
    city: "Mexico City",
    state: "",
    country: "Mexico",
    latitude: 19.4326,
    longitude: -99.1332,
    timezone: "America/Mexico_City",
  },
  {
    city: "Berlin",
    state: "",
    country: "Germany",
    latitude: 52.52,
    longitude: 13.405,
    timezone: "Europe/Berlin",
  },
  {
    city: "Rome",
    state: "",
    country: "Italy",
    latitude: 41.9028,
    longitude: 12.4964,
    timezone: "Europe/Rome",
  },
  {
    city: "Madrid",
    state: "",
    country: "Spain",
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: "Europe/Madrid",
  },
  {
    city: "Amsterdam",
    state: "",
    country: "Netherlands",
    latitude: 52.3676,
    longitude: 4.9041,
    timezone: "Europe/Amsterdam",
  },
  {
    city: "Vienna",
    state: "",
    country: "Austria",
    latitude: 48.2082,
    longitude: 16.3738,
    timezone: "Europe/Vienna",
  },
  {
    city: "Zurich",
    state: "",
    country: "Switzerland",
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: "Europe/Zurich",
  },
  {
    city: "Stockholm",
    state: "",
    country: "Sweden",
    latitude: 59.3293,
    longitude: 18.0686,
    timezone: "Europe/Stockholm",
  },
  {
    city: "Copenhagen",
    state: "",
    country: "Denmark",
    latitude: 55.6761,
    longitude: 12.5683,
    timezone: "Europe/Copenhagen",
  },
  {
    city: "Helsinki",
    state: "",
    country: "Finland",
    latitude: 60.1699,
    longitude: 24.9384,
    timezone: "Europe/Helsinki",
  },
  {
    city: "Warsaw",
    state: "",
    country: "Poland",
    latitude: 52.2297,
    longitude: 21.0122,
    timezone: "Europe/Warsaw",
  },
  {
    city: "Budapest",
    state: "",
    country: "Hungary",
    latitude: 47.4979,
    longitude: 19.0402,
    timezone: "Europe/Budapest",
  },
  {
    city: "Prague",
    state: "",
    country: "Czech Republic",
    latitude: 50.0755,
    longitude: 14.4378,
    timezone: "Europe/Prague",
  },
  {
    city: "Munich",
    state: "",
    country: "Germany",
    latitude: 48.1351,
    longitude: 11.582,
    timezone: "Europe/Berlin",
  },
  {
    city: "Milan",
    state: "",
    country: "Italy",
    latitude: 45.4642,
    longitude: 9.19,
    timezone: "Europe/Rome",
  },
];

export class LocationService {
  static searchLocations(query: string): LocationSearchResult[] {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: LocationSearchResult[] = [];

    for (const location of LOCATION_DATABASE) {
      const cityMatch = location.city.toLowerCase().includes(normalizedQuery);
      const stateMatch =
        location.state &&
        location.state.toLowerCase().includes(normalizedQuery);
      const countryMatch = location.country
        .toLowerCase()
        .includes(normalizedQuery);

      if (cityMatch || stateMatch || countryMatch) {
        const displayName = location.state
          ? `${location.city}, ${location.state}, ${location.country}`
          : `${location.city}, ${location.country}`;

        results.push({
          city: location.city,
          state: location.state,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          displayName,
        });
      }
    }

    // Sort by relevance (exact city match first, then partial)
    return results
      .sort((a, b) => {
        const aCityExact = a.city.toLowerCase() === normalizedQuery;
        const bCityExact = b.city.toLowerCase() === normalizedQuery;

        if (aCityExact && !bCityExact) return -1;
        if (!aCityExact && bCityExact) return 1;

        return a.city.length - b.city.length;
      })
      .slice(0, 10); // Limit to 10 results
  }

  static getLocationByCoords(
    latitude: number,
    longitude: number
  ): Location | null {
    // Find closest location within 1 degree (~111km)
    let closest: Location | null = null;
    let minDistance = Infinity;

    for (const location of LOCATION_DATABASE) {
      const distance = Math.sqrt(
        Math.pow(location.latitude - latitude, 2) +
          Math.pow(location.longitude - longitude, 2)
      );

      if (distance < minDistance && distance < 1) {
        minDistance = distance;
        closest = location;
      }
    }

    return closest;
  }

  static validateLocation(city: string, state: string): Location | null {
    return (
      LOCATION_DATABASE.find(
        (loc) =>
          loc.city.toLowerCase() === city.toLowerCase() &&
          (!state || loc.state.toLowerCase() === state.toLowerCase())
      ) || null
    );
  }

  static getAllCities(): string[] {
    return LOCATION_DATABASE.map((loc) => loc.city).sort();
  }

  static getCitiesByState(state: string): string[] {
    return LOCATION_DATABASE.filter(
      (loc) => loc.state.toLowerCase() === state.toLowerCase()
    )
      .map((loc) => loc.city)
      .sort();
  }

  static getAllStates(): string[] {
    const states = new Set(
      LOCATION_DATABASE.map((loc) => loc.state).filter(Boolean)
    );
    return Array.from(states).sort();
  }
}
