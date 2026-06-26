// app/api/geocoding/route.ts
import { NextResponse } from 'next/server';

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Reverse geocoding (lat/lon to address)
  if (lat && lon) {
    try {
      const params = new URLSearchParams({
        lat,
        lon,
        format: 'json',
        addressdetails: '1',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            'User-Agent': 'Merlin-Astrology-App/1.0',
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Reverse geocoding request failed' },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (data.error) {
        return NextResponse.json({ result: null });
      }

      const address = data.address || {};
      const city =
        address.city || address.town || address.village || address.name || '';
      const state = address.state || address.region || '';
      const country = address.country || '';

      const result = {
        city,
        state,
        country,
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        displayName:
          data.display_name ||
          `${city}, ${state}, ${country}`
            .replace(/,,/g, ',')
            .replace(/, $/, ''),
      };

      return NextResponse.json({ result });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return NextResponse.json(
        { error: 'Reverse geocoding failed' },
        { status: 500 }
      );
    }
  }

  // Forward geocoding (query to locations)
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "10",
      countrycodes:
        "us,gb,fr,de,it,es,ca,mx,jp,au,ru,br,in,za,nz,ie,ch,at,se,dk,fi,no,pl,cz,hu,pt,gr,be,nl,lu",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      headers: {
        'User-Agent': 'Merlin-Astrology-App/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Geocoding request failed: ${response.statusText}`);
      return NextResponse.json(
        { error: `Geocoding request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const results = data
      .map((item: any) => {
        const address = item.address || {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.hamlet ||
          address.municipality ||
          "Unknown";

        const state =
          address.state ||
          address.region ||
          address.province ||
          address.county ||
          "";

        const country = address.country || "Unknown";

        return {
          city,
          state,
          country,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
        };
      })
      .filter(
        (result: any) =>
          !isNaN(result.latitude) &&
          !isNaN(result.longitude) &&
          result.city !== "Unknown"
      );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding failed' },
      { status: 500 }
    );
  }
}
